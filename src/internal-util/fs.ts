import * as FS from 'fs';

import { ExpectedError } from 'clime';
import * as v from 'villa';

export async function isDirEmpty(dir: string): Promise<boolean> {
  return !(await v.call(FS.readdir, dir)).length;
}
