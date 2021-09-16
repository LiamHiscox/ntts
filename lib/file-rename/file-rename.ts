import {renameSync} from "fs";
import {join} from "path";
import globby from "globby";
import {IgnoreConfigParser} from "../ignore-config-parser/ignore-config-parser";

const defaultIgnore = [
  "**/*.config.js",
  "**/node_modules/**"
];

export class FileRename {
  private static renameFile(file: string): void {
    const fullFile = join(file);
    const newFile = fullFile.replace(/\.\w+$/, '.ts');
    renameSync(fullFile, newFile);
  }

  private static findFiles(ignore: string[], targetPath: string): string[] {
    return globby.sync(
      [`${targetPath}**/*.js`, `${targetPath}**/*.mjs`, `${targetPath}**/*.cjs`],
      {
        cwd: process.cwd(),
        ignore: [...defaultIgnore, ...ignore]
      });
  }

  /**
   * @param targetPath the path to search for javascript files in
   */
  static rename(targetPath: string): void {
    const ignores = IgnoreConfigParser.getIgnores();
    const formattedPath = IgnoreConfigParser.formatTargetPath(targetPath);
    const filesToRename = FileRename.findFiles(ignores, formattedPath);
    filesToRename.forEach(file => FileRename.renameFile(file));
  }
}
