import { spawn } from 'child_process';
import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as FSE from 'fs-extra';
import * as Tmp from 'tmp';
import * as v from 'villa';
import { Resolvable } from 'villa';

// tslint:disable-next-line:max-line-length
const DIFF_OUTPUT_REGEX = /^(?:\x1b\[\d+m)?diff --git [^\n\x1b]+(?:\x1b\[m)?\n(?:(?:\x1b\[\d+m)?(?!index )[^\n\x1b]+(?:\x1b\[m)?\n)*(?:\x1b\[\d+m)?index [\da-f]{7}..[\da-f]{7}(?:\x1b\[m)?\n(?:\x1b\[\d+m)?--- ([^\n\x1b]+)(?:\x1b\[m)?\n(?:\x1b\[\d+m)?\+\+\+ ([^\n\x1b]+)(?:\x1b\[m)?/mg;

let tempEmptyDir = Tmp.dirSync().name;

export interface TestCaseOwner {
  baselineDir: string;
  outputDir: string;
}

export abstract class TestCase {
  owner: TestCaseOwner;
  readonly description: string | undefined;

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

  // TODO: not used after changing output dir creation strategy.
  clean(): Resolvable<void>;
  async clean(): Promise<void> {
    await v.call(FSE.remove, this.outputPath);
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
      '--no-prefix',
      '--color',
      '--minimal',
      '--unified=1024',
      baselinePath,
      outputPath,
    ]);

    let buffers: Buffer[] = [];

    cp.stdout.on('data', data => buffers.push(data as Buffer));

    let code = await v.awaitable<number>(cp, 'exit');

    if (code) {
      return Buffer
        .concat(buffers)
        .toString()
        .replace(DIFF_OUTPUT_REGEX, (text, src: string, dist: string) => {
          dist = dist.replace(/^"|"$/g, '');

          if (!Path.isAbsolute(dist)) {
            dist = `/${dist}`;
          }

          return `diff "${Path.relative(this.owner.outputDir, dist)}"`;
        });
    } else {
      return undefined;
    }
  }

  async accept(): Promise<void> {
    await v.call(FSE.remove, this.baselinePath);
    await v.call(FSE.copy, this.outputPath, this.baselinePath);
  }

  private checkOwner(): void {
    if (!this.owner) {
      throw new Error(`Test case "${this.id}" has not been added to a test`);
    }
  }
}
