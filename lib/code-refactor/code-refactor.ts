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
import {TypesRefactor} from "./types-refactor/types-refactor";

export class CodeRefactor {
  static convertToTypescript = (project: Project, target: string) => {
    Logger.info('Refactoring exports');
    project.getSourceFiles().forEach(ExportsRefactor.moduleExportsToExport);
    Logger.success('Exports refactored');
    project.saveSync();

    Logger.info('Refactoring requires to imports');
    const modulesResult = project.getSourceFiles().reduce((moduleSpecifierResult: ModuleSpecifierRefactorModel, sourceFile) => {
      Logger.info(sourceFile.getFilePath());
      ImportsRefactor.requiresToImports(sourceFile);
      ImportsRefactor.refactorImportClauses(sourceFile);
      return ImportsRefactor.reformatImports(sourceFile, moduleSpecifierResult);
    }, {fileEndings: []});
    ImportsRefactor.resolveModuleSpecifierResults(modulesResult);
    Logger.success('Requires refactored');
    project.saveSync();

    Logger.info('Refactoring classes');
    project.getSourceFiles().forEach(ClassRefactor.toTypeScriptClasses);
    Logger.success('Classes refactored');
    project.saveSync();

    Logger.info('Generating interfaces from object literal types');
    project.getSourceFiles().forEach(s => TypesRefactor.createInterfacesFromObjectTypes(s, project, target));
    Logger.success('Generated interfaces from object literal types where possible');
    project.saveSync();

    Logger.info('Declaring parameter types by usage');
    project.getSourceFiles().forEach(TypesRefactor.inferParameterTypes);
    project.getSourceFiles().forEach(TypesRefactor.inferParameterTypes);
    Logger.success('Parameter type declared where possible');
    project.saveSync();

    Logger.info('Declaring variable and property types by initialization');
    project.getSourceFiles().forEach(TypesRefactor.setInitialTypes);
    Logger.success('Declared variable and property types by initialization');
    project.saveSync();

    Logger.info('Declaring variable and property types by write access');
    project.getSourceFiles().forEach(s => TypesRefactor.inferWriteAccessType(s, project, target));
    Logger.success('Variable and Property type declared where possible');
    project.saveSync();

    Logger.info('Checking usage of generated interfaces for additional Properties and types');
    project.getSourceFiles().forEach(s => TypesRefactor.addPropertiesFromUsageOfInterface(s, project, target));
    Logger.success('Defined type and added properties to interfaces where possible');
    project.saveSync();

    Logger.info('Checking usage of properties of generated interfaces for write access');
    TypesRefactor.checkInterfaceProperties(project, target);
    Logger.success('Checked write access of properties of interfaces where possible');
    project.saveSync();

    Logger.info('Inferring type of untyped declarations by contextual type');
    project.getSourceFiles().forEach(TypesRefactor.inferContextualType);
    Logger.success('Inferred type where possible');
    project.saveSync();

    Logger.info('Replacing types any and never with unknown');
    project.getSourceFiles().forEach(TypesRefactor.replaceInvalidTypes);
    Logger.success('Replaced types any and never with unknown where possible');
    project.saveSync();

    Logger.info('Merging duplicate interfaces');
    TypesRefactor.mergeDuplicateInterfaces(project, target);
    Logger.success('Merged duplicate interfaces where possible');
    project.saveSync();

    Logger.info('Refactoring import types to simple type references and importing global variables');
    project.getSourceFiles().forEach(TypesRefactor.refactorImportTypesAndTypeReferences);
    Logger.success('Refactored import types to simple type references and imported global variables where possible');
    project.saveSync();
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

