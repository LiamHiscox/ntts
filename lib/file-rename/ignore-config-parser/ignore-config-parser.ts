import {existsSync, readFileSync} from "fs";

const gitignore = '.gitignore';
const nttsignore = '.nttsignore';

export class IgnoreConfigParser {
  /**
   * @returns string[] returns all ignores of the root .nttsignore or .gitignore if provided
   */
  static getIgnores = (): string[] => {
    if (existsSync(nttsignore))
      return IgnoreConfigParser.parseFile(nttsignore);
    if (existsSync(gitignore))
      return IgnoreConfigParser.parseFile(gitignore);
    return [];
  }

  private static parseFile = (path: string): string[] => {
    return readFileSync(path, {encoding: 'utf-8'})
      .replace('\r\n', '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => !!line && !line.startsWith('#'));
  }
}
