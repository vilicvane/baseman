import { spawn } from 'child_process';
import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as FSE from 'fs-extra';
import * as Tmp from 'tmp';
import * as v from 'villa';
import { Resolvable } from 'villa';

let tempEmptyDir = Tmp.dirSync().name;

export interface TestCaseOwner {
  baselineDir: string;
  outputDir: string;
}

export abstract class TestCase {
  owner: TestCaseOwner;

  constructor(
    public readonly id: string,
  ) { }

  get baselinePath(): string {
    this.checkOwner();
    return Path.join(this.owner.baselineDir, this.id);
  }

  get outputPath(): string {
    this.checkOwner();
    return Path.join(this.owner.outputDir, this.id);
  }

  clean(): Resolvable<void>;
  async clean(): Promise<void> {
    let outputPath = this.outputPath;
    let stats = await v.call(FSE.stat, outputPath).catch(v.bear);

    if (!stats) {
      return;
    }

    if (stats.isFile()) {
      await v.call(FSE.unlink, outputPath);
    } else {
      await v.call(FSE.remove, outputPath);
    }
  }

  abstract test(): Resolvable<void>;

  diff(): Resolvable<string | undefined>
  async diff(): Promise<string | undefined> {
    let baselinePath = this.baselinePath;
    let outputPath = this.outputPath;

    let baselineStats = await v.call(FSE.stat, baselinePath).catch(v.bear);
    let referenceStats = await v.call(FSE.stat, outputPath).catch(v.bear);

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
      outputPath += '/';
    } else if (!baselineStats) {
      return await v.call<string>(FSE.readFile, outputPath, 'utf-8');
    }

    let cp = spawn('git', [
      'diff',
      '--no-index',
      '--color=always',
      baselinePath,
      outputPath,
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
