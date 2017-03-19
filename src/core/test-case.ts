import { spawn } from 'child_process';
import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as FSE from 'fs-extra';
import * as Tmp from 'tmp';
import * as v from 'villa';
import { Resolvable } from 'villa';

let tempEmptyDir = Tmp.dirSync().name;

export interface TestCaseOwner {
  baselinePath: string;
  referencePath: string;
}

export abstract class TestCase {
  owner: TestCaseOwner;

  constructor(
    public readonly id: string,
  ) { }

  get baselinePath(): string {
    this.checkOwner();
    return Path.join(this.owner.baselinePath, this.id);
  }

  get referencePath(): string {
    this.checkOwner();
    return Path.join(this.owner.referencePath, this.id);
  }

  clean(): Resolvable<void>;
  async clean(): Promise<void> {
    let referencePath = this.referencePath;
    let stats = await v.call(FSE.stat, referencePath).catch(v.bear);

    if (!stats) {
      return;
    }

    if (stats.isFile()) {
      await v.call(FSE.unlink, referencePath);
    } else {
      await v.call(FSE.remove, referencePath);
    }
  }

  abstract test(): Resolvable<void>;

  diff(): Resolvable<string | undefined>
  async diff(): Promise<string | undefined> {
    let baselinePath = this.baselinePath;
    let referencePath = this.referencePath;

    let baselineStats = await v.call(FSE.stat, baselinePath).catch(v.bear);
    let referenceStats = await v.call(FSE.stat, referencePath).catch(v.bear);

    if (!referenceStats) {
      throw new ExpectedError(`No reference has been created by test case "${this.id}"`);
    }

    let isDir = referenceStats.isDirectory();

    if (isDir) {
      if (baselineStats) {
        baselinePath += '/';
      } else {
        baselinePath = tempEmptyDir + '/';
      }
      referencePath += '/';
    } else if (!baselineStats) {
      return await v.call<string>(FSE.readFile, referencePath, 'utf-8');
    }

    let cp = spawn('git', [
      'diff',
      '--no-index',
      '--color=always',
      baselinePath,
      referencePath,
    ]);

    let buffers: Buffer[] = [];

    cp.stdout.on('data', data => buffers.push(data as Buffer));

    let code = await v.awaitable<number>(cp, 'exit');

    if (code) {
      return Buffer.concat(buffers).toString();
    } else {
      return undefined;
    }
  }

  private checkOwner(): void {
    if (!this.owner) {
      throw new Error(`Test case "${this.id}" has not been added to a test`);
    }
  }
}
