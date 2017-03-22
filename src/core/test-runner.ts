import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as FSE from 'fs-extra';
import * as Tmp from 'tmp';
import * as v from 'villa';
import { Resolvable } from 'villa';

import {
  Test,
  TestCase,
  TestLoadProgress,
  TestRunOnCaseOutputChanged,
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

  async run(
    progressHandler: TestRunnerRunOnProgress,
    caseOutputChangedHandler?: TestRunOnCaseOutputChanged,
  ): Promise<void> {
    let changed = false;

    for (let test of this.tests) {
      await test.load(progressHandler);

      if (this.filter) {
        let count = test.filter(this.filter);
        progressHandler({ type: 'filtered', count });
      }

      let passed = await test.run(progressHandler, caseOutputChangedHandler);

      if (!changed && !passed) {
        changed = true;
      }
    }

    if (!this.filter) {
      await v.call(FSE.remove, this.outputDir).catch(v.bear);
      await v.call(FSE.move, this.tempOutputDir, this.outputDir);
    }

    progressHandler({ type: 'completed' });

    if (changed) {
      if (this.filter) {
        throw new ExpectedError('Output has changed');
      } else {
        throw new ExpectedError('Output has changed, run `baseman accept` to accept the new output as baseline');
      }
    }
  }
}
