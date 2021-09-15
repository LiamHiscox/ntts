import {existsSync, readFileSync} from "fs";
import {IgnoreConfigModel} from "../models/ignore-config.model";

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

  private static splitLines = (lines: string[]): IgnoreConfigModel => {
    return lines.reduce((split: IgnoreConfigModel, line: string) => {
      if (line.startsWith('!')) {
        const reformatted = IgnoreConfigParser.reformat(line.substring(1));
        return {...split, keep: split.keep.concat(reformatted)}
      } else {
        const reformatted = IgnoreConfigParser.reformat(line);
        return {...split, ignore: split.ignore.concat(reformatted)}
      }
    }, {ignore: new Array<string>(), keep: new Array<string>()});
  }

  private static parseFile = (path: string, targetPath: string): IgnoreConfigModel => {
    const lines = readFileSync(path, {encoding: 'utf-8'})
      .replace('\r\n', '\n')
      .split('\n')
      .concat(targetPath)
      .filter(line => {
        const trimmed = line.trim();
        return !!trimmed && !trimmed.startsWith('#');
      })
    return IgnoreConfigParser.splitLines(lines);
  }

  private static formatTargetPath = (path: string): string => {
    return path
      .replace(/\.{1,2}\//g, '')
      .replace(/^\//g, '')
      .replace(/\/$/g, '/**');
  }

  static getIgnores = (path: string): IgnoreConfigModel => {
    const formattedPath = IgnoreConfigParser.formatTargetPath(path);
    if (existsSync('.gitignore')) {
      return IgnoreConfigParser.parseFile('.gitignore', formattedPath);
    } else {
      return {keep: [formattedPath], ignore: []};
    }
  }
}
