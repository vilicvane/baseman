import { SubcommandDefinition } from 'clime';

import {
  homepage,
  version,
} from '../../../package.json';

export const description = `\
Baseman Testing Framework v${version}

${homepage}`;

export const subcommands: SubcommandDefinition[] = [
  { name: 'run' },
  { name: 'accept' },
];
