import * as FS from 'fs';
import * as Path from 'path';

const errorStackRegex = /^([A-Z]\w*Error(?:: .+)?)\n(?: {4}at .+\n)+/mg;

export function blurErrorStack(output: string): string {
  return output.replace(errorStackRegex, '$1\n    [stack]');
}

export interface BlurPathOptions {
  extensions?: string[];
  relative?: boolean;
  absolute?: boolean;
  existingOnly?: boolean;
  quotedOnly?: boolean;
}

// tslint:disable-next-line:max-line-length
const pathRegex = /(["'`]?)(?:[A-Za-z]:)?((?:\\\\?|\/)?[\w\d.-]+(?:(?:\\\\?|\/)[\w\d.-]+)+(?:(?:\\\\?|\/)[\w\d.-]*)?)\1/g;

export function blurPath(
  output: string,
  {
    extensions,
    relative = false,
    absolute = true,
    existingOnly = true,
    quotedOnly = false,
  }: BlurPathOptions = {},
): string {
  return output.replace(pathRegex, (text, quote: string, path: string) => {
    if (quotedOnly && !quote) {
      return text;
    }

    if (Path.isAbsolute(path)) {
      if (!absolute) {
        return text;
      }
    } else {
      if (!relative) {
        return text;
      }
    }

    if (extensions && extensions.indexOf(Path.extname(path)) < 0) {
      return text;
    }

    if (existingOnly && !FS.existsSync(path)) {
      return text;
    }

    return quote ? `${quote}[path]${quote}` : '[path]';
  });
}
