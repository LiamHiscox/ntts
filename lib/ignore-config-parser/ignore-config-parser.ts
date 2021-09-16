import {existsSync, readFileSync} from "fs";

export class IgnoreConfigParser {
  private static reformatStart = (entry: string): string => {
    if (entry.startsWith('/')) {
      return entry.substring(1);
    } else if (entry.startsWith('**/')) {
      return entry;
    } else {
      return `**/${entry}`;
    }
  }

  private static reformatEnd = (entry: string): string => {
    return entry.replace(/\/$/g, '/**');
  }

  private static reformat = (entry: string): string => {
    return IgnoreConfigParser.reformatStart(
      IgnoreConfigParser.reformatEnd(entry))
  }

  private static parseFile = (path: string): string[] => {
    return readFileSync(path, {encoding: 'utf-8'})
      .replace('\r\n', '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => !!line && !line.startsWith('#'))
      .map(line => {
        if (line.startsWith('!')) {
          return '!' + IgnoreConfigParser.reformat(line.substring(1));
        } else {
          return IgnoreConfigParser.reformat(line);
        }
      })
  }

  static formatTargetPath = (path: string): string => {
    const newPath = path
      .trim()
      .replace(/\.{1,2}\//g, '')
      .replace(/^\//g, '')
      .replace(/\/$/g, '');
    if (newPath) {
      return newPath + '/';
    } else {
      return '';
    }
  }

  static getIgnores = (): string[] => {
    if (existsSync('.gitignore')) {
      return IgnoreConfigParser.parseFile('.gitignore');
    } else {
      return [];
    }
  }
}
