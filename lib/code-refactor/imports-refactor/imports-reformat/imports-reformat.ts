import { ImportDeclaration, SourceFile } from 'ts-morph';
import { existsSync } from 'fs';
import { join } from 'path';
import ModuleSpecifierRefactorModel from '../../../models/module-specifier-refactor.model';
import FileRename from '../../../file-rename/file-rename';

class ImportsReformat {
  private static knownFileEndings = ['json', 'js', 'cjs', 'mjs', 'jsx', 'ts', 'tsx'];

  static refactorModuleSpecifier = (
    importStatement: ImportDeclaration,
    moduleSpecifierRefactor: ModuleSpecifierRefactorModel,
    sourceFile: SourceFile,
  ): ModuleSpecifierRefactorModel => {
    const moduleSpecifier = importStatement.getModuleSpecifierValue();
    const isJavaScriptFile = FileRename.isJavaScriptFile(moduleSpecifier);
    if (!importStatement.getModuleSpecifierSourceFile()) {

      // if the path has and explicit JavaScript file ending set allowJs to true
      if (isJavaScriptFile) {
        const renamedSpecifier = FileRename.renameFileEnding(moduleSpecifier, '');
        importStatement.setModuleSpecifier(renamedSpecifier);
        return { ...moduleSpecifierRefactor, allowJs: true };
      }
      const absolutePath = join(sourceFile.getDirectoryPath(), moduleSpecifier);
      const exists = existsSync(absolutePath);
      const isRelative = importStatement.isModuleSpecifierRelative();

      // if the file exists and is a JSON file the resolveJsonModule option is enabled
      if (moduleSpecifier.endsWith('.json') && isRelative && exists) {
        return { ...moduleSpecifierRefactor, allowJson: true };
      }

      // if it is an unknown file ending, that file ending is enabled as a module
      const unknownEnding = this.unknownFile(moduleSpecifier);
      if (unknownEnding && isRelative && exists) {
        return {
          ...moduleSpecifierRefactor,
          fileEndings: moduleSpecifierRefactor.fileEndings.concat(unknownEnding),
        };
      }

      // if no TypeScript file exists for the given path, it is concluded that a javascript file is targeted
      const tsPath = join(sourceFile.getDirectoryPath(), moduleSpecifier, '.ts');
      const tsxPath = join(sourceFile.getDirectoryPath(), moduleSpecifier, '.tsx');
      if (isRelative && !existsSync(tsPath) && !existsSync(tsxPath)) {
        return { ...moduleSpecifierRefactor, allowJs: true };
      }
    }
    return moduleSpecifierRefactor;
  };

  private static unknownFile = (file: string): string | undefined => {
    const paths = file.split('/');
    const split = paths[paths.length - 1].split('.');
    const ending = split[split.length - 1];
    if (split.length > 1 && !this.knownFileEndings.includes(ending)) {
      return ending;
    }
    return undefined;
  };
}

export default ImportsReformat;
