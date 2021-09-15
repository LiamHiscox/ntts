import {renameSync} from "fs";
import {join} from "path";
import globby from "globby";

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

  private static findFiles(ignore: string[], keep: string[]): string[] {
    return globby.sync(
      ["**/*.js", "**/*.mjs", "**/*.cjs", ...keep],
      {
        cwd: process.cwd(),
        ignore: [...defaultIgnore, ...ignore]
      });
  }

  /**
   * @param ignore files and directories to ignore in .gitignore style format.
   * @param keep files and directories to keep in .gitignore style format.
   */
  static rename(ignore: string[], keep: string[]): void {
    const filesToRename = FileRename.findFiles(ignore, keep);
    filesToRename.forEach(file => FileRename.renameFile(file));
  }
}
