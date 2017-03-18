import * as Path from 'path';

import {
  Command,
  Object as ClimeObject,
  command,
  param,
} from 'clime';

import { run } from '../../util';
import { BASELINE_DIR, REFERENCE_DIR } from '../config';

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
      referenceDir: REFERENCE_DIR,
    });
  }
}
