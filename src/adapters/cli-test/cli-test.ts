import { spawn } from 'child_process';
import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as FSE from 'fs-extra';
import * as Tmp from 'tmp';
import * as v from 'villa';
import { Resolvable } from 'villa';

import {
  Test,
  TestCase,
} from '../..';

import { isDirEmpty } from '../../internal-util';

export interface CLITestCaseOptions {
  cwd?: string;
  allowNonEmptyCWD?: boolean;
  /** Case contents to copy from */
  dir?: string;
}

export class CLITestCase extends TestCase {
  owner: CLITest;
  cwd: string;
  allowNonEmptyCWD: boolean;
  dir: string | undefined;

  private isCWDTemporary: boolean;

  constructor(
    id: string,
    public args: string[],
    {
      cwd,
      allowNonEmptyCWD = false,
      dir,
    }: CLITestCaseOptions = {},
  ) {
    super(id);

    if (cwd) {
      this.cwd = cwd;
      this.isCWDTemporary = false;
    } else {
      this.cwd = Tmp.dirSync().name;
      this.isCWDTemporary = true;
    }

    this.allowNonEmptyCWD = allowNonEmptyCWD;
    this.dir = dir;
  }

  async test(): Promise<void> {
    if (!this.allowNonEmptyCWD && !await isDirEmpty(this.cwd)) {
      throw new ExpectedError(`Working directory "${this.cwd}" is not empty, set \`allowNonEmptyCWD\` option \
to \`true\` explicitly to suppress this error`);
    }

    if (this.dir) {
      await v.call(FSE.copy, this.dir, this.cwd);
    }

    let { executable, precedingArgs } = this.owner;
    let args = precedingArgs.concat(this.args);

    let cp = spawn(executable, args, { cwd: this.cwd });

    let stdoutBuffers: Buffer[] = [];
    let stderrBuffers: Buffer[] = [];

    cp.stdout.on('data', data => stdoutBuffers.push(data as Buffer));
    cp.stderr.on('data', data => stderrBuffers.push(data as Buffer));

    let code = await v.awaitable<number>(cp, 'exit');

    let stdout: Buffer | string = Buffer.concat(stdoutBuffers);
    let stderr: Buffer | string = Buffer.concat(stderrBuffers);

    if (this.extractOutput) {
      [stdout, stderr] = this.extractOutput(stdout, stderr);
    }

    let referencePath = this.referencePath;

    await v.call(FSE.ensureDir, referencePath);

    if (stdout.length) {
      let path = Path.join(referencePath, '_stdout');
      await v.call(FSE.writeFile, path, stdout);
    }

    if (stderr.length) {
      let path = Path.join(referencePath, '_stderr');
      await v.call(FSE.writeFile, path, stderr);
    }

    let exitCodePath = Path.join(referencePath, '_code');
    await v.call(FSE.writeFile, exitCodePath, `0x${code.toString(16)}\n`);

    if (this.extractFileSystemOutput) {
      await this.extractFileSystemOutput();
    }

    if (this.isCWDTemporary) {
      await v.call(FSE.remove, this.cwd).catch(v.bear);
    }
  }

  extractOutput?(stdout: Buffer, stderr: Buffer): [Buffer | string, Buffer | string];

  extractFileSystemOutput?(): Resolvable<void>;
}

export interface CLITestOptions {
  precedingArgs?: string[];
  description?: string;
}

export abstract class CLITest extends Test<CLITestCase> {
  public precedingArgs: string[];

  constructor(
    public executable: string,
    { precedingArgs, description }: CLITestOptions = {},
  ) {
    super(description);
    this.precedingArgs = precedingArgs ? precedingArgs.concat() : [];
  }
}
