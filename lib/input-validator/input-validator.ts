import {resolve} from "path";
import {Logger} from "../logger/logger";
import {existsSync} from "fs";

export class InputValidator {
  static validate(path: string): string|null {
    const fullPath = resolve(path).split('\\').join('/');
    const cwd = process.cwd().split('\\').join('/');
    if (!existsSync(path)) {
      Logger.error('The given target does not exist!');
      return null;
    }
    if (!fullPath.startsWith(cwd)) {
      Logger.error('The given target is outside the root project!');
      return null;
    }
    return fullPath.substring(cwd.length).replace(/^\//, '');
  }
}
