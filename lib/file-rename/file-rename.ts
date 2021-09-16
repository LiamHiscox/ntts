import {Dirent, readdirSync, renameSync} from "fs";
import {join} from "path";
import {IgnoreConfigParser} from "../ignore-config-parser/ignore-config-parser";
import ignore, {Ignore} from "ignore";

const defaultIgnore = ["node_modules/"];

export class FileRename {
  /**
   * @param targetPath the path to search for javascript files in
   */
  static rename(targetPath: string): void {
    const ignores = defaultIgnore.concat(IgnoreConfigParser.getIgnores());
    FileRename.findFiles(ignores, targetPath);
  }

  private static renameFile(file: string): void {
    const newFile = file.replace(/\.\w+$/, '.ts');
    renameSync(file, newFile);
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
