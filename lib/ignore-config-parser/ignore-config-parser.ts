import {existsSync, readFileSync} from "fs";

export class IgnoreConfigParser {
  /**
   * @returns string[] returns all ignores of the root .gitignore if provided
   */
  static getIgnores = (): string[] => {
    if (existsSync('.gitignore')) {
      return IgnoreConfigParser.parseFile('.gitignore');
    } else {
      return [];
    }
  }

  private static parseFile = (path: string): string[] => {
    return readFileSync(path, {encoding: 'utf-8'})
      .replace('\r\n', '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => !!line && !line.startsWith('#'));
  }
}
