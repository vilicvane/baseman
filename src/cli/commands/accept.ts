import * as Path from 'path';

import {
  Command,
  command,
  metadata,
} from 'clime';

import { print } from '../../internal-util';
import { accept } from '../../lib';
import { BASELINE_DIR, OUTPUT_DIR } from '../config';

@command({
  description: 'Accept new output as baseline',
})
export default class extends Command {
  @metadata
  async execute() {
    await accept(OUTPUT_DIR, BASELINE_DIR);
  }
}
