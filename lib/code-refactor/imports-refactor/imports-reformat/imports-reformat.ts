import {ImportDeclaration} from "ts-morph";
import {ModuleSpecifierRefactorModel} from "../../../models/module-specifier-refactor.model";
import {FileRename} from "../../../file-rename/file-rename";
import {existsSync} from "fs";

export class ImportsReformat {
  private static knownFileEndings = ['json', 'js', 'cjs', 'mjs', 'jsx', 'ts', 'tsx'];

  static refactorModuleSpecifier = (importStatement: ImportDeclaration, moduleSpecifierRefactor: ModuleSpecifierRefactorModel): ModuleSpecifierRefactorModel => {
    const moduleSpecifier = importStatement.getModuleSpecifierValue();
    const isJavaScriptFile = FileRename.isJavaScriptFile(moduleSpecifier);
    if (!importStatement.getModuleSpecifierSourceFile()) {
      if (isJavaScriptFile) {
        const renamedSpecifier = FileRename.replaceEnding(moduleSpecifier);
        importStatement.setModuleSpecifier(renamedSpecifier);
      }
      const exists = existsSync(moduleSpecifier);
      const isRelative = importStatement.isModuleSpecifierRelative();
      if (moduleSpecifier.endsWith('.json') && isRelative && exists) {
        return {...moduleSpecifierRefactor, allowJson: true};
      }
      const unknownEnding = this.unknownFile(moduleSpecifier);
      if (unknownEnding && isRelative && exists) {
        return {
          ...moduleSpecifierRefactor,
          fileEndings: moduleSpecifierRefactor.fileEndings.concat(unknownEnding)
        };
      }
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