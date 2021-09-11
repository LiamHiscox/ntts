import {renameSync} from "fs";
import {join} from "path";
import globby from "globby";

const defaultIgnore = [
  "**/*.config.js",
  "**/node_modules/**"
];

export class FileRename {
  private static renameFile(path: string, file: string): void {
    const fullFile = join(path, file);
    const newFile = fullFile.replace(/\.\w+$/, '.ts');
    renameSync(fullFile, newFile);
  }

  private static findFiles(path: string, ignore: string[]): string[] {
    return globby.sync(
      ["**/*.js", "**/*.mjs", "**/*.cjs"],
      {
        cwd: path,
        ignore: [...defaultIgnore, ...ignore]
      });
  }

  /**
   * @param path the target folder to recursively rename the files in.
   * @param ignore files and directories to ignore in .gitignore style format.
   */
  static rename(path: string, ignore: string[]): void {
    const fullPath = join(process.cwd(), path);
    const filesToRename = FileRename.findFiles(fullPath, ignore);
    filesToRename.forEach(file => FileRename.renameFile(fullPath, file));
  }
}
