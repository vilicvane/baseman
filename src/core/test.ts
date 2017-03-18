import * as FS from 'fs';
import * as Path from 'path';

import * as glob from 'glob';
import * as v from 'villa';
import { Resolvable } from 'villa';

import { TestCase } from './test-case';

export interface TestOwner {
  baselineDir: string;
  referenceDir: string;
}

export type TestCaseGeneratorProgressHandler = (done: number, total: number) => void;
export type TestCaseGenerator<T extends TestCase> = (progress: TestCaseGeneratorProgressHandler) => Resolvable<T[]>;

export interface TestOptions<T extends TestCase> {
  generator: TestCaseGenerator<T>;
  description?: string;
}

export abstract class Test<T extends TestCase> {
  owner: TestOwner;

  private caseNameSet = new Set<string>();
  private cases: T[] = [];
  private testCaseGenerator: TestCaseGenerator<T>;

  constructor(
    public description?: string,
  ) { }

  get referenceDir(): string {
    this.checkOwner();
    return this.owner.referenceDir;
  }

  get baselineDir(): string {
    this.checkOwner();
    return this.owner.baselineDir;
  }

  abstract generate(progress?: TestCaseGeneratorProgressHandler): Resolvable<void>;

  async run(): Promise<void> {
    for (let testCase of this.cases) {
      await testCase.test();
    }
  }

  protected add(cases: T[]): void {
    let caseNameSet = this.caseNameSet;

    for (let testCase of cases) {
      if (caseNameSet.has(testCase.id)) {
        throw new Error(`Duplicate test case name "${testCase.id}"`);
      }

      caseNameSet.add(testCase.id);
      testCase.owner = this;
    }

    this.cases.push(...cases);
  }

  private checkOwner(): void {
    if (!this.owner) {
      throw new Error('Test has not been attached to a test runner');
    }
  }
}

export type GeneralTest = Test<TestCase>;
