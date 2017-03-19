import * as Path from 'path';

import {
  Command,
  Object as ClimeObject,
  command,
  param,
} from 'clime';

import { print } from '../../internal-util';
import { run } from '../../util';
import { BASELINE_DIR, OUTPUT_DIR } from '../config';

@command({
  description: 'Run baseman tests',
})
export default class extends Command {
  async execute(
    @param({
      description: 'The directory that contains tests',
      default: 'test/baseman',
    })
    dir: ClimeObject.Directory,
  ) {
    await dir.assert();

    await run(dir.fullName, {
      pattern: '*-test.js',
      baselineDir: BASELINE_DIR,
      outputDir: OUTPUT_DIR,
    }, progress => {
      switch (progress.type) {
        case 'start-loading':
          print('Generating test cases...');
          break;
        case 'loaded':
          print(`Generated ${progress.total} test cases.`);
          break;
        case 'start-running':
          print('Start running test cases...');
          break;
        case 'running':
          print(`Finished ${progress.done}/${progress.total}...`);

          if (progress.lastCaseDiff !== undefined) {
            print(`
[The output of case "${progress.lastCaseId}" has changed]\n
${progress.lastCaseDiff}\n`);
          }

          break;
      }
    });
  }
}
