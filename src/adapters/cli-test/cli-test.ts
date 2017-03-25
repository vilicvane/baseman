import { CLITestCase } from './cli-test-case';

import {
  Test,
  TestCase,
} from '../..';

export interface CLITestOptions {
  precedingArgs?: string[];
  description?: string;
}

export abstract class CLITest extends Test<CLITestCase> {
  public precedingArgs: string[];

  constructor(
    public executable: string,
    { precedingArgs, description }: CLITestOptions = {},
  ) {
    super(description);
    this.precedingArgs = precedingArgs ? precedingArgs.concat() : [];
  }
}
