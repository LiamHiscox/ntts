import {Project, SourceFile} from "ts-morph";
import {Dirent, readdirSync} from "fs";
import ignore, {Ignore} from "ignore";
import {join} from "path";
import {ImportsRefactor} from "./imports-refactor/imports-refactor";
import {ClassRefactor} from "./class-refactor/class-refactor";
import {ExportsRefactor} from "./exports-refactor/exports-refactor";

export class CodeRefactor {
  static convertToTypescript = (sourceFile: SourceFile) => {
    ExportsRefactor.moduleExportsToExport(sourceFile);
    ImportsRefactor.requiresToImports(sourceFile);
    ClassRefactor.toTypeScriptClasses(sourceFile);
  }

  static addSourceFiles = (project: Project, ignores: string[], path: string): Project => {
    const ig = ignore().add(ignores);
    this.readDirectory(project, path || '.', ig);
    return project;
  }

  private static readDirectory = (project: Project, path: string, ig: Ignore): Project => {
    readdirSync(path, {withFileTypes: true})
      .forEach(item => this.checkDirectoryEntry(project, item, path, ig));
    return project;
  }

  private static checkDirectoryEntry = (project: Project, item: Dirent, path: string, ig: Ignore): Project => {
    const fullPath = join(path, item.name);
    const ignores = ig.ignores(fullPath);

    if (!ignores && item.isFile() && fullPath.endsWith('.ts')) {
      project.addSourceFileAtPath(fullPath);
    }
    if (!ignores && item.isDirectory()) {
      this.readDirectory(project, fullPath, ig);
    }
    return project;
  }
}
