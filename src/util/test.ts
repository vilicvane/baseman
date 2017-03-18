import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as glob from 'glob';
import * as v from 'villa';

import {
  Test,
  TestCase,
  TestRunner,
} from '..';

export interface RunOptions {
  pattern: string;
  baselineDir: string;
  referenceDir: string;
}

export async function run(
  dir: string,
  {
    pattern,
    baselineDir,
    referenceDir,
  }: RunOptions,
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
    referenceDir,
  });

  for (let test of tests) {
    runner.attach(test);
  }

  await runner.run();
}
