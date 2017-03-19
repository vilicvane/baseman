import * as Path from 'path';

import {
  Command,
  command,
  metadata,
} from 'clime';

import { print } from '../../internal-util';
import { accept } from '../../util';
import { BASELINE_DIR, REFERENCE_DIR } from '../config';

@command({
  description: 'Accept output in reference directory as new baseline',
})
export default class extends Command {
  @metadata
  async execute() {
    await accept(REFERENCE_DIR, BASELINE_DIR);
  }
}
