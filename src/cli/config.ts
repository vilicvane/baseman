import * as Path from 'path';

import { getProjectDir } from '../internal-util';

export const PROJECT_DIR = getProjectDir(Path.resolve());
export const BASEMAN_DIR = Path.join(PROJECT_DIR, 'test/baseman');
export const BASELINE_DIR = Path.join(BASEMAN_DIR, 'baseline');
export const OUTPUT_DIR = Path.join(BASEMAN_DIR, 'output');
