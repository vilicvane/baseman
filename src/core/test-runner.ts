import * as Path from 'path';

import { ExpectedError } from 'clime';

import {
  Test,
  TestCase,
  TestLoadProgress,
  TestRunProgress,
} from '..';

export interface TestFilteredProgress {
  type: 'filtered';
  count: number;
}

export type TestRunnerRunProgress = TestLoadProgress | TestRunProgress | TestFilteredProgress;
export type TestRunnerRunOnProgress = (progress: TestRunnerRunProgress) => void;

export interface TestRunnerOptions {
  baselineDir: string;
  outputDir: string;
  filter?: string;
}

export class TestRunner {
  public readonly baselineDir: string;
  public readonly outputDir: string;

  private tests: Test<TestCase>[] = [];
  private filter: string | undefined;

  constructor(options: TestRunnerOptions) {
    this.baselineDir = options.baselineDir;
    this.outputDir = options.outputDir;
    this.filter = options.filter;
  }

  attach(test: Test<TestCase>): void {
    test.owner = this;
    this.tests.push(test);
  }

  async run(progress: TestRunnerRunOnProgress): Promise<void> {
    let changed = false;

    for (let test of this.tests) {
      await test.load(progress);

      if (this.filter) {
        let count = test.filter(this.filter);
        progress({ type: 'filtered', count });
      }

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
