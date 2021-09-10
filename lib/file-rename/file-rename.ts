import {renameSync} from "fs";
import {join} from "path";
import globby from "globby";

export class FileRename {
  private static renameFile(path: string, file: string): void {
    const fullFile = join(path, file);
    const newFile = fullFile.replace(/\.\w+$/, '.ts');
    renameSync(fullFile, newFile);
  }

  private static findFiles(path: string): string[] {
    return globby.sync(["**/*.js"], {
      cwd: path,
      ignore: [
        "**/*.config.js",
        "**/node_modules/**"
      ]
    });
  }

  /**
   * @param path the target folder to recursively rename the files in.
   */
  static rename(path: string): void {
    const fullPath = join(process.cwd(), path);
    const filesToRename = FileRename.findFiles(fullPath);
    filesToRename.forEach(file => FileRename.renameFile(fullPath, file));
  }
}
