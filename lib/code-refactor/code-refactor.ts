import {Project} from "ts-morph";
import {Dirent, readdirSync} from "fs";
import ignore, {Ignore} from "ignore";
import {join} from "path";
import {ImportsRefactor} from "./imports-refactor/imports-refactor";
import {ClassRefactor} from "./class-refactor/class-refactor";
import {ExportsRefactor} from "./exports-refactor/exports-refactor";
import {ModuleSpecifierRefactorModel} from "../models/module-specifier-refactor.model";
import {Logger} from "../logger/logger";
import {TsconfigHandler} from "../tsconfig-handler/tsconfig-handler";

export class CodeRefactor {
  static convertToTypescript = (project: Project) => {
    Logger.info('Refactoring exports');
    project.getSourceFiles().forEach(ExportsRefactor.moduleExportsToExport);
    Logger.success('Exports refactored');

    Logger.info('Refactoring requires to imports');
    const modulesResult = project.getSourceFiles().reduce((moduleSpecifierResult: ModuleSpecifierRefactorModel, sourceFile) => {
      Logger.info(sourceFile.getFilePath());
      ImportsRefactor.requiresToImports(sourceFile);
      ImportsRefactor.refactorImportClauses(sourceFile);
      return ImportsRefactor.reformatImports(sourceFile, moduleSpecifierResult);
    }, {fileEndings: []});
    ImportsRefactor.resolveModuleSpecifierResults(modulesResult);
    Logger.success('Requires refactored');

    Logger.info('Refactoring classes');
    project.getSourceFiles().forEach(ClassRefactor.toTypeScriptClasses);
    Logger.success('Classes refactored');
  }

  static addSourceFiles = (ignores: string[], path: string): Project => {
    const project = new Project({
      tsConfigFilePath: TsconfigHandler.tsconfigFileName(),
      skipAddingFilesFromTsConfig: true
    });
    Logger.info('Loading project files');
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

