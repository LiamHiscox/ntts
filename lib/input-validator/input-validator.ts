import { resolve } from 'path';
import { existsSync } from 'fs';
import Logger from '../logger/logger';
import PathParser from '../helpers/path-parser/path-parser';

class InputValidator {
  static validate = (path: string): string|null => {
    const fullPath = PathParser.win32ToPosixPath(resolve(path));
    const cwd = PathParser.win32ToPosixPath(process.cwd());
    if (!existsSync(fullPath)) {
      Logger.error('The given target does not exist!');
      return null;
    }
    if (!fullPath.startsWith(cwd)) {
      Logger.error('The given target is outside the root project!');
      return null;
    }
    return fullPath.substring(cwd.length).replace(/^\//, '');
  };
}

export default InputValidator;
