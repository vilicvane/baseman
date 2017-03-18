import * as Path from 'path';

import * as v from 'villa';
import { Resolvable } from 'villa';

export interface TestCaseOwner {
  baselineDir: string;
  referenceDir: string;
}

export abstract class TestCase {
  owner: TestCaseOwner;

  constructor(
    public readonly id: string,
  ) { }

  get baselineDir(): string {
    this.checkOwner();
    return Path.join(this.owner.baselineDir, this.id);
  }

  get referenceDir(): string {
    this.checkOwner();
    return Path.join(this.owner.referenceDir, this.id);
  }

  abstract test(): Resolvable<void>;

  private checkOwner(): void {
    if (!this.owner) {
      throw new Error(`Test case "${this.id}" has not been added to a test`);
    }
  }
}
