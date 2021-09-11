import {existsSync, readFileSync} from "fs";
import { join } from "path";

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
    if (entry.endsWith('/')) {
      return entry + '**';
    } else {
      return entry;
    }
  }

  private static reformat = (entry: string): string => {
    return IgnoreConfigParser.reformatStart(
      IgnoreConfigParser.reformatEnd(entry))
  }

  static parseFile = (path: string): string[] => {
    return readFileSync(path, {encoding: 'utf-8'})
      .replace('\r\n', '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => !!line && !line.startsWith('#'))
      .map(line => IgnoreConfigParser.reformat(line));
  }

  static getIgnores = (path: string = ''): string[] => {
    if (existsSync(join(path, '.gitignore'))) {
      return IgnoreConfigParser.parseFile(join(path, '.gitignore'));
    } else {
      return [];
    }
  }
}
