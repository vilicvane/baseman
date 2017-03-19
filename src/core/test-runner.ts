import * as Path from 'path';

import { ExpectedError } from 'clime';

import {
  Test,
  TestCase,
  TestLoadProgress,
  TestRunProgress,
} from '..';

export type TestRunnerRunProgress = TestLoadProgress | TestRunProgress;
export type TestRunnerRunOnProgress = (progress: TestRunnerRunProgress) => void;

export interface TestRunnerOptions {
  baselineDir: string;
  outputDir: string;
}

export class TestRunner {
  public readonly baselineDir: string;
  public readonly outputDir: string;

  private tests: Test<TestCase>[] = [];

  constructor(options: TestRunnerOptions) {
    this.baselineDir = options.baselineDir;
    this.outputDir = options.outputDir;
  }

  attach(test: Test<TestCase>): void {
    test.owner = this;
    this.tests.push(test);
  }

  async run(progress: TestRunnerRunOnProgress): Promise<void> {
    let changed = false;

    for (let test of this.tests) {
      await test.load(progress);

      let passed = await test.run(progress);

      if (!changed && !passed) {
        changed = true;
      }
    }

    if (changed) {
      throw new ExpectedError('Output has changed, run `baseman accept` to accept the new output as baseline');
    }
  }
}
