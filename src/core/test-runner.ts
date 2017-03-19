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
  baselinePath: string;
  referencePath: string;
}

export class TestRunner {
  public readonly baselinePath: string;
  public readonly referencePath: string;

  private tests: Test<TestCase>[] = [];

  constructor(options: TestRunnerOptions) {
    this.baselinePath = options.baselinePath;
    this.referencePath = options.referencePath;
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
