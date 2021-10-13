import {Dirent, readdirSync, renameSync} from "fs";
import {join} from "path";
import ignore, {Ignore} from "ignore";
import {Logger} from "../logger/logger";


export class FileRename {
  /**
   * @param target the path to search for javascript files in
   * @param ignores the files and directories to ignore while renaming the javascript files
   */
  static rename(target: string, ignores: string[]): void {
    Logger.info('Renaming all JavaScript files');
    FileRename.findFiles(ignores, target || '.');
    Logger.success('All JavaScript files renamed to TypeScript files');
  }

  /**
   * @param file the filename of the javascript file to change
   * @returns string returns the formatted filename
   */
  static renameFileName(file: string): string {
    return file.replace(/\.[mc]?js$/g, '.ts');
  }

  private static renameFile(file: string): void {
    renameSync(file, this.renameFileName(file));
  }

  private static checkDirectoryEntry = (item: Dirent, path: string, ig: Ignore, ignoreList: string[]) => {
    const fullPath = join(path, item.name);
    if (item.isFile() && !ig.ignores(fullPath) && (/^.*\.[mc]?js$/g).test(item.name)) {
      this.renameFile(fullPath);
    } if(item.isDirectory() && !ig.ignores(fullPath)) {
      this.findFiles(ignoreList, fullPath);
    }
  }

  private static findFiles(ignoreList: string[], path: string): void {
    const ig = ignore().add(ignoreList);
    readdirSync(path, {withFileTypes: true})
      .forEach(item => this.checkDirectoryEntry(item, path, ig, ignoreList))
  }
}
