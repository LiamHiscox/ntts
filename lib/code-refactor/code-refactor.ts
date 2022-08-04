import {Project} from 'ts-morph';
import {Dirent, readdirSync} from 'fs';
import ignore, {Ignore} from 'ignore';
import {join} from 'path';
import ImportsRefactor from './imports-refactor/imports-refactor';
import ClassRefactor from './class-refactor/class-refactor';
import ExportsRefactor from './exports-refactor/exports-refactor';
import ModuleSpecifierRefactorModel from '../models/module-specifier-refactor.model';
import Logger from '../logger/logger';
import TsconfigHandler from '../tsconfig-handler/tsconfig-handler';
import TypesRefactor from './types-refactor/types-refactor';
import {generateProgressBar} from './helpers/generate-progress-bar/generate-progress-bar';
import {addTypeAlias, getTypeAliasType} from './types-refactor/interface-handler/interface-creator/interface-creator';

class CodeRefactor {
  static convertToTypescript = (project: Project, target: string, unknown: boolean) => {
    this.refactorExports(project);
    this.refactorImports(project);
    this.refactorClasses(project);
    this.addTypeAlias(project, target, unknown);
    this.setFunctionReturnTypes(project, target);
    this.generateInterfaces(project, target);
    this.inferParameterTypes(project, target);
    this.inferFunctionTypeParameterTypes(project, target);
    this.inferParameterTypes(project, target);
    this.inferFunctionTypeParameterTypes(project, target);
    this.inferWriteAccessType(project, target);
    this.inferContextualType(project, target);
    this.inferInterfaceProperties(project, target);
    this.replaceTypes(project, target);
    this.mergeInterfaces(project, target);
    this.filterUnionType(project);
    this.mergeInterfaces(project, target);
    this.removeUnnecessaryTypeNodes(project);
    this.refactorImportTypesAndGlobalVariables(project);
    this.simplifyOptionalNodes(project, target);
    this.simplifyTypeNodes(project);
  };

  static addSourceFiles = (ignores: string[], path: string): Project => {
    Logger.info('Loading project files');
    const project = new Project({
      tsConfigFilePath: TsconfigHandler.tsconfigFileName(),
      skipAddingFilesFromTsConfig: true,
    });
    const ig = ignore().add(ignores);
    this.readDirectory(project, path || '.', ig);
    return project;
  };

  private static readDirectory = (project: Project, path: string, ig: Ignore): Project => {
    readdirSync(path, {withFileTypes: true})
      .forEach((item) => this.checkDirectoryEntry(project, item, path, ig));
    return project;
  };

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
  };

  private static refactorExports = (project: Project) => {
    Logger.info('Refactoring exports');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      ExportsRefactor.moduleExportsToExport(s);
      bar.tick();
    });
    Logger.success('Exports refactored');
  }

  private static refactorImports = (project: Project) => {
    Logger.info('Refactoring requires to imports');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    const modulesResult = sourceFiles.reduce((moduleSpecifierResult: ModuleSpecifierRefactorModel, s) => {
      ImportsRefactor.requiresToImports(s);
      ImportsRefactor.refactorImportClauses(s);
      const result = ImportsRefactor.reformatImports(s, moduleSpecifierResult);
      bar.tick();
      return result;
    }, {fileEndings: []});
    ImportsRefactor.resolveModuleSpecifierResults(modulesResult);
    Logger.success('Requires refactored');
  }

  private static refactorClasses = (project: Project) => {
    Logger.info('Refactoring classes');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      ClassRefactor.toTypeScriptClasses(s);
      bar.tick();
    });
    Logger.success('Classes refactored');
  }

  private static generateInterfaces = (project: Project, target: string) => {
    Logger.info('Generating interfaces from object literal types');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      TypesRefactor.createInterfacesFromObjectTypes(s, project, target);
      bar.tick();
    });
    Logger.success('Generated interfaces from object literal types where possible');
  }

  private static inferParameterTypes = (project: Project, target: string) => {
    Logger.info('Declaring parameter types by usage');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach(s => {
      TypesRefactor.inferParameterTypes(s, project, target);
      bar.tick();
    });
    Logger.success('Parameter type declared where possible');
  }

  private static inferFunctionTypeParameterTypes = (project: Project, target: string) => {
    Logger.info('Declaring parameter types of function types by usage');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach(s => {
      TypesRefactor.inferFunctionTypeParameterTypes(s, project, target);
      bar.tick();
    });
    Logger.success('Parameter type declared where possible');
  }

  private static inferWriteAccessType = (project: Project, target: string) => {
    Logger.info('Declaring variable and property types by write access');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      TypesRefactor.inferWriteAccessType(s, project, target);
      bar.tick();
    });
    Logger.success('Variable and Property type declared where possible');
  };

  private static inferInterfaceProperties = (project: Project, target: string) => {
    Logger.info('Checking usage of generated interfaces for additional properties and types');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      TypesRefactor.inferInterfaceProperties(s, project, target);
      bar.tick();
    });
    Logger.success('Defined type and added properties to interfaces where possible');
  }

  private static inferContextualType = (project: Project, target: string) => {
    Logger.info('Inferring type of untyped declarations by contextual type');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      TypesRefactor.inferContextualType(s, project, target);
      bar.tick();
    });
    Logger.success('Inferred type where possible');
  }

  private static replaceTypes = (project: Project, target: string) => {
    Logger.info('Replacing undesirable types');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    const typeAlias = getTypeAliasType(project, target);
    sourceFiles.forEach((s) => {
      TypesRefactor.replaceInvalidTypes(s, typeAlias);
      bar.tick();
    });
    Logger.success('Replaced undesirable types');
  }

  private static mergeInterfaces = (project: Project, target: string) => {
    Logger.info('Merging duplicate interfaces');
    TypesRefactor.mergeDuplicateInterfaces(project, target);
    Logger.success('Merged duplicate interfaces where possible');
  }

  private static refactorImportTypesAndGlobalVariables = (project: Project) => {
    Logger.info('Refactoring import types to simple type references and importing global variables');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      TypesRefactor.refactorImportTypesAndTypeReferences(s);
      bar.tick();
    });
    Logger.success('Refactored import types to simple type references and imported global variables where possible');
  }

  private static filterUnionType = (project: Project) => {
    Logger.info('Filtering out duplicate types in union types');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      TypesRefactor.filterUnionType(s);
      bar.tick();
    });
    Logger.success('Filtered union types');
  }

  private static simplifyOptionalNodes = (project: Project, target: string) => {
    Logger.info('Removing undefined type from optional node');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    const typeAlias = getTypeAliasType(project, target);
    sourceFiles.forEach((s) => {
      TypesRefactor.removeUndefinedFromOptional(s, typeAlias);
      bar.tick();
    });
    Logger.success('Removed undefined types');
  }

  private static simplifyTypeNodes = (project: Project) => {
    Logger.info('Removing null or undefined types');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      TypesRefactor.removeNullOrUndefinedTypes(s);
      bar.tick();
    });
    Logger.success('Removed null or undefined types');
  }

  private static addTypeAlias = (project: Project, target: string, unknown: boolean) => {
    Logger.info(`Adding type alias of type ${unknown ? 'unknown' : 'any'}`);
    addTypeAlias(project, target, unknown);
    Logger.success('Added type alias');
  }

  private static setFunctionReturnTypes = (project: Project, target: string) => {
    Logger.info('Replacing object types of function returns with interfaces');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      TypesRefactor.setFunctionReturnTypes(s, project, target);
      bar.tick();
    });
    Logger.success('Replaced object types of function returns with interfaces');
  }

  private static removeUnnecessaryTypeNodes = (project: Project) => {
    Logger.info('Removing unnecessary type nodes');
    const sourceFiles = project.getSourceFiles();
    const bar = generateProgressBar(sourceFiles.length);
    sourceFiles.forEach((s) => {
      TypesRefactor.removeUnnecessaryTypeNodes(s);
      bar.tick();
    });
    Logger.success('Removed unnecessary type nodes');
  }
}

export default CodeRefactor;
