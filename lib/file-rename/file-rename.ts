import { Dirent, readdirSync, renameSync } from 'fs';
import { join } from 'path';
import ignore, { Ignore } from 'ignore';
import Logger from '../logger/logger.js';

class FileRename {
  private static javaScriptEnding = /\.[mc]?js$/g;

  static rename = (target: string, ignores: string[]): void => {
    Logger.info('Renaming all JavaScript files');
    FileRename.findAndRename(ignores, target || '.');
    Logger.success('All JavaScript files renamed to TypeScript files');
  };

  static renameFileEnding = (file: string, newEnding: string): string => file.replace(this.javaScriptEnding, newEnding);

  static isJavaScriptFile = (file: string): boolean => this.javaScriptEnding.test(file);

  private static renameFile = (file: string): void => {
    renameSync(file, this.renameFileEnding(file, '.ts'));
  };

  private static checkDirectoryEntry = (item: Dirent, path: string, ig: Ignore, ignoreList: string[]) => {
    const fullPath = join(path, item.name);
    if (item.isFile() && !ig.ignores(fullPath) && this.javaScriptEnding.test(item.name)) {
      this.renameFile(fullPath);
    }
    if (item.isDirectory() && !ig.ignores(fullPath)) {
      this.findAndRename(ignoreList, fullPath);
    }
  };

  private static findAndRename = (ignoreList: string[], path: string): void => {
    const ig = ignore().add(ignoreList);
    readdirSync(path, { withFileTypes: true })
      .forEach((item) => this.checkDirectoryEntry(item, path, ig, ignoreList));
  };
}

export default FileRename;
