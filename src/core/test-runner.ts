import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as FSE from 'fs-extra';
import * as Tmp from 'tmp';
import * as v from 'villa';

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

export interface TestCompletedProgress {
  type: 'completed';
}

export type TestRunnerRunProgress =
  TestLoadProgress |
  TestRunProgress |
  TestFilteredProgress |
  TestCompletedProgress;

export type TestRunnerRunOnProgress = (progress: TestRunnerRunProgress) => void;

export interface TestRunnerOptions {
  baselineDir: string;
  outputDir: string;
  filter?: string;
}

export class TestRunner {
  public readonly baselineDir: string;
  public readonly tempOutputDir = Tmp.dirSync().name;

  private outputDir: string;
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

    if (!this.filter) {
      await v.call(FSE.remove, this.outputDir).catch(v.bear);
      await v.call(FSE.move, this.tempOutputDir, this.outputDir);
    }

    progress({ type: 'completed' });

    if (changed) {
      throw new ExpectedError('Output has changed, run `baseman accept` to accept the new output as baseline');
    }
  }
}
