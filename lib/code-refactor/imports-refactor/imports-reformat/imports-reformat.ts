import {ImportDeclaration, SourceFile} from "ts-morph";
import {ModuleSpecifierRefactorModel} from "../../../models/module-specifier-refactor.model";
import {FileRename} from "../../../file-rename/file-rename";
import {existsSync} from "fs";
import {join} from "path";

export class ImportsReformat {
  private static knownFileEndings = ['json', 'js', 'cjs', 'mjs', 'jsx', 'ts', 'tsx'];

  static refactorModuleSpecifier = (importStatement: ImportDeclaration, moduleSpecifierRefactor: ModuleSpecifierRefactorModel, sourceFile: SourceFile): ModuleSpecifierRefactorModel => {
    const moduleSpecifier = importStatement.getModuleSpecifierValue();
    const isJavaScriptFile = FileRename.isJavaScriptFile(moduleSpecifier);
    if (isJavaScriptFile) {
      const renamedSpecifier = FileRename.replaceEnding(moduleSpecifier);
      importStatement.setModuleSpecifier(renamedSpecifier);
    }
    if (isJavaScriptFile && importStatement.isModuleSpecifierRelative() && existsSync(join(sourceFile.getDirectoryPath(), moduleSpecifier))) {
      return {...moduleSpecifierRefactor, allowJs: true};
    }
    if (moduleSpecifier.endsWith('.json')) {
      return {...moduleSpecifierRefactor, allowJson: true};
    }
    const unknownEnding = this.unknownFile(moduleSpecifier);
    if (unknownEnding) {
      return {
        ...moduleSpecifierRefactor,
        declareFileEndingModules: moduleSpecifierRefactor.declareFileEndingModules.concat(unknownEnding)
      };
    }
    if (!importStatement.isModuleSpecifierRelative() && !importStatement.getModuleSpecifierSourceFile()) {
      const specifier = importStatement.getModuleSpecifierValue();
      return {
        ...moduleSpecifierRefactor,
        declareModules: moduleSpecifierRefactor.declareModules.concat(specifier)
      };
    }
    return moduleSpecifierRefactor;
  }

  private static unknownFile = (file: string): string | undefined => {
    const paths = file.split('/');
    const split = paths[paths.length - 1].split('.');
    const ending = split[split.length - 1];
    if (split.length > 1 && !this.knownFileEndings.includes(ending)) {
      return ending;
    }
    return;
  }
}
