import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as FSE from 'fs-extra';
import * as glob from 'glob';
import * as v from 'villa';
import { Resolvable } from 'villa';

import {
  Test,
  TestCase,
  TestRunOnCaseOutputChanged,
  TestRunner,
  TestRunnerRunOnProgress,
} from '..';

export interface RunOptions {
  pattern: string;
  baselineDir: string;
  outputDir: string;
  filter?: string;
}

export async function run(
  dir: string,
  {
    pattern,
    baselineDir,
    outputDir,
    filter,
  }: RunOptions,
  progressHandler: TestRunnerRunOnProgress = () => { },
  caseOutputChangedHandler?: TestRunOnCaseOutputChanged,
): Promise<void> {
  let tests = (await v.call(glob, pattern, {
    cwd: dir,
    nodir: true,
  }))
    .map(fileName => {
      let path = Path.join(dir, fileName);

      let module = require(path);
      let test: Test<TestCase> = module.default || module;

      if (!(test instanceof Test)) {
        throw new ExpectedError(`File "${path}" does not export a valid baseman test`);
      }

      return test;
    });

  let runner = new TestRunner({
    baselineDir,
    outputDir,
    filter,
  });

  for (let test of tests) {
    runner.attach(test);
  }

  await runner.run(progressHandler, caseOutputChangedHandler);
}

export async function accept(outputDir: string, baselineDir: string): Promise<void> {
  let referenceStats = await v.call(FSE.stat, outputDir).catch(v.bear);

  if (!referenceStats) {
    throw new ExpectedError(`Reference directory "${outputDir}" does not exist`);
  }

  await v.call(FSE.remove, baselineDir).catch(v.bear);
  await v.call(FSE.move, outputDir, baselineDir);
}
