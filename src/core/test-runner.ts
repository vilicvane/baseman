import * as Path from 'path';

import {
  Test,
  TestCase,
} from '..';

export interface TestRunnerOptions {
  baselineDir: string;
  referenceDir: string;
}

export class TestRunner {
  public readonly baselineDir: string;
  public readonly referenceDir: string;

  private tests: Test<TestCase>[] = [];

  constructor(options: TestRunnerOptions) {
    this.baselineDir = options.baselineDir;
    this.referenceDir = options.referenceDir;
  }

  attach(test: Test<TestCase>): void {
    test.owner = this;
    this.tests.push(test);
  }

  async run(): Promise<void> {
    for (let test of this.tests) {
      await test.run();
    }
  }
}
