import * as FS from 'fs';
import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as v from 'villa';

export async function isDirEmpty(dir: string): Promise<boolean> {
  return !(await v.call(FS.readdir, dir)).length;
}

export function getProjectDir(startDir: string): string {
  let currentDir = startDir;
  let lastDir: string | undefined;

  while (lastDir !== currentDir) {
    let path = Path.join(currentDir, 'package.json');
    let stats: FS.Stats | undefined;

    try {
      stats = FS.statSync(path);
    } catch (error) { }

    if (stats && stats.isFile()) {
      return currentDir;
    }

    lastDir = currentDir;
    currentDir = Path.dirname(currentDir);
  }

  return startDir;
}
