import {existsSync, readFileSync} from "fs";
import {Logger} from "../../logger/logger";

const gitignore = '.gitignore';
const nttsignore = '.nttsignore';
const defaultIgnore = ["node_modules/"];

export class IgnoreConfigParser {
  /**
   * @returns string[] returns all ignores of the root .nttsignore or .gitignore if provided
   */
  static getIgnores = (): string[] => {
    if (existsSync(nttsignore)) {
      Logger.info('Reading .nttsignore file');
      return IgnoreConfigParser.parseFile(nttsignore).concat(defaultIgnore);
    }
    if (existsSync(gitignore)) {
      Logger.info('Reading .gitignore file');
      return IgnoreConfigParser.parseFile(gitignore).concat(defaultIgnore);
    }
    Logger.warn('No ignore file found!');
    return defaultIgnore;
  }

  private static parseFile = (path: string): string[] => {
    return readFileSync(path, {encoding: 'utf-8'})
      .replace('\r\n', '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => !!line && !line.startsWith('#'));
  }
}
