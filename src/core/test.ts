import * as FS from 'fs';
import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as glob from 'glob';
import * as minimatch from 'minimatch';
import * as v from 'villa';
import { Resolvable } from 'villa';

import { TestCase } from './test-case';

export interface TestOwner {
  baselineDir: string;
  outputDir: string;
}

export interface TestStartLoadingProgress {
  type: 'start-loading';
}

export interface TestStartGeneratingProgress {
  type: 'start-generating';
}

export interface TestGeneratingProgress {
  type: 'generating';
  done: number;
  total: number;
}

export interface TestLoadedProgress {
  type: 'loaded';
  total: number;
}

export type TestLoadProgress =
  TestStartLoadingProgress |
  TestStartGeneratingProgress |
  TestGeneratingProgress |
  TestLoadedProgress;

export type TestLoadOnProgress = (progress: TestLoadProgress) => void;

export interface TestStartRunningProgress {
  type: 'start-running';
  total: number;
}

export interface TestRunningProgress {
  type: 'running';
  lastCaseId: string;
  lastCaseDiff?: string;
  done: number;
  total: number;
}

export type TestRunProgress =
  TestStartRunningProgress |
  TestRunningProgress;

export type TestRunOnProgress = (progress: TestRunProgress) => void;

export type TestGenerateOnProgress = (done: number, total: number) => void;

export abstract class Test<T extends TestCase> {
  owner: TestOwner;

  private cases: T[];
  private loaded = false;

  constructor(
    public description?: string,
  ) { }

  get outputDir(): string {
    this.checkOwner();
    return this.owner.outputDir;
  }

  get baselineDir(): string {
    this.checkOwner();
    return this.owner.baselineDir;
  }

  async load(progress: TestLoadOnProgress): Promise<void> {
    if (this.loaded) {
      return;
    }

    progress({ type: 'start-loading' });
    progress({ type: 'start-generating' });

    let cases = await this.generate((done, total) => progress({
      type: 'generating',
      done,
      total,
    }));

    let caseNameSet = new Set<string>();

    for (let testCase of cases) {
      if (caseNameSet.has(testCase.id)) {
        throw new ExpectedError(`Duplicate test case ID "${testCase.id}"`);
      }

      testCase.owner = this;
      caseNameSet.add(testCase.id);
    }

    this.cases = cases;

    progress({ type: 'loaded', total: cases.length });

    this.loaded = true;
  }

  filter(filter: string): number {
    let total = this.cases.length;
    this.cases = this.cases.filter(testCase => minimatch(testCase.id, filter));
    return total - this.cases.length;
  }

  /**
   * @returns A boolean indicates whether this test passes.
   */
  async run(progress: TestRunOnProgress): Promise<boolean> {
    if (!this.loaded) {
      throw new Error('Test has not yet been loaded');
    }

    let cases = this.cases;
    let total = cases.length;

    progress({ type: 'start-running', total });

    let passed = true;

    for (let [index, testCase] of cases.entries()) {
      await testCase.clean();
      await testCase.test();

      let diff = await testCase.diff();

      if (passed && diff !== undefined) {
        passed = false;
      }

      progress({
        type: 'running',
        lastCaseId: testCase.id,
        lastCaseDiff: diff,
        done: index + 1,
        total,
      });
    }

    return passed;
  }

  abstract generate(progress: TestGenerateOnProgress): Resolvable<T[]>;

  private checkOwner(): void {
    if (!this.owner) {
      throw new Error('Test has not been attached to a test runner');
    }
  }
}

export type GeneralTest = Test<TestCase>;
