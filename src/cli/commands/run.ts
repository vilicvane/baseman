import * as Path from 'path';

import {
  Command,
  Context,
  Object as ClimeObject,
  Options,
  command,
  option,
  param,
} from 'clime';

import * as Chalk from 'chalk';
import { prompt } from 'inquirer';
import * as Tmp from 'tmp';

import { print } from '../../internal-util';
import { run } from '../../util';
import { BASELINE_DIR, OUTPUT_DIR } from '../config';

import {
  TestCase,
  TestRunnerRunProgress,
} from '../..';

export class RunOptions extends Options {
  @option({
    description: 'A minimatch string to filter test cases by their IDs',
    flag: 'f',
  })
  filter: string | undefined;

  @option({
    description: 'Run test cases in interactive mode',
    flag: 'i',
    toggle: true,
  })
  interactive: boolean;
}

export class RunContext extends Context {
  progressHandler(progress: TestRunnerRunProgress): void {
    switch (progress.type) {
      case 'start-loading':
        print('Loading test cases...');
        break;
      case 'loaded':
        print(`Loaded ${progress.total} test cases.`);
        break;
      case 'filtered':
        print(`Filtered ${progress.count} test cases.`);
        break;
      case 'start-running':
        print('Start running test cases...\n');
        break;
      case 'running':
        let changed = progress.lastCaseDiff !== undefined;

        let doneStr = progress.done.toString();
        let totalStr = progress.total.toString();

        doneStr = new Array(totalStr.length - doneStr.length + 1).join(' ') + doneStr;

        let progressStr = `[${doneStr}/${totalStr}]`;
        let lastCase = progress.lastCase;

        if (changed) {
          let description = lastCase.description;
          print(`\
  ${Chalk.red(`${progressStr} × ${lastCase.id}`)}
${description ? `\n${Chalk.yellow(description)}\n` : ''}
${progress.lastCaseDiff}`);
        } else {
          print(`  ${Chalk.gray(`${progressStr}`)} ${Chalk.green('√')} ${lastCase.id}`);
        }

        break;
      case 'completed':
        print();
        break;
    }
  }

  async caseOutputChangedHandler(testCase: TestCase): Promise<void> {
    let answer = await prompt([{
      name: 'accepted',
      type: 'confirm',
      message: 'Accept as baseline?',
      default: false,
    }]);

    if (answer.accepted) {
      await testCase.accept();
      print(`\nAccepted new baseline for case "${testCase.id}".\n`);
    }
  }
}

@command({
  description: 'Run baseman tests',
})
export default class extends Command {
  async execute(
    @param({
      name: 'dir',
      description: 'The directory that contains tests',
      default: 'test/baseman',
    })
    dir: ClimeObject.Directory,

    {
      filter,
      interactive,
    }: RunOptions,

    {
      progressHandler,
      caseOutputChangedHandler,
    }: RunContext,
  ) {
    await dir.assert();

    await run(
      dir.fullName,
      {
        pattern: '*-test.js',
        baselineDir: BASELINE_DIR,
        outputDir: OUTPUT_DIR,
        filter,
      },
      progressHandler,
      interactive ? caseOutputChangedHandler : undefined,
    );
  }
}
