import {
  CallExpression, Node, SourceFile, SyntaxKind,
} from 'ts-morph';
import ImportValidator from './helpers/import-validator.js';
import ExpressionImportsRefactor from './expression-import-refactor/expression-imports-refactor.js';
import CallImportsRefactor from './call-import-refactor/call-imports-refactor.js';
import DeclarationImportRefactor from './declaration-import-refactor/declaration-import-refactor.js';
import UsedNames from '../helpers/used-names/used-names.js';
import ImportClauseRefactor from './import-clause-refactor/import-clause-refactor.js';
import ModuleSpecifierRefactorModel from '../../models/module-specifier-refactor.model.js';
import TsconfigHandler from '../../tsconfig-handler/tsconfig-handler.js';
import ImportsReformat from './imports-reformat/imports-reformat.js';
import ModuleDeclarator from '../../module-declarator/module-declarator.js';

class ImportsRefactor {
  static refactorImportClauses = (sourceFile: SourceFile) => {
    const importDeclarations = UsedNames.getDeclaredImportNames(sourceFile);
    sourceFile.getImportDeclarations().reduce((usedNames, importStatement) =>
        ImportClauseRefactor.refactorImportClause(importStatement, usedNames, sourceFile), importDeclarations);
  };

  static reformatImports = (sourceFile: SourceFile, moduleSpecifierResult: ModuleSpecifierRefactorModel): ModuleSpecifierRefactorModel => sourceFile
    .getImportDeclarations()
    .reduce((moduleSpecifierRefactor: ModuleSpecifierRefactorModel, importStatement) =>
      ImportsReformat.refactorModuleSpecifier(importStatement, moduleSpecifierRefactor, sourceFile), moduleSpecifierResult);

  static resolveModuleSpecifierResults = (moduleSpecifierResult: ModuleSpecifierRefactorModel) => {
    ModuleDeclarator.handleUntypedPackages(moduleSpecifierResult.fileEndings, true);
    if (moduleSpecifierResult.allowJs || moduleSpecifierResult.allowJson) {
      TsconfigHandler.addCompilerOptions(moduleSpecifierResult);
    }
  };

  static requiresToImports = (sourceFile: SourceFile) => {
    const usedNames = UsedNames.getDeclaredNames(sourceFile);
    sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .forEach((callExpression) => {
        if (!callExpression.wasForgotten() && ImportValidator.validRequire(callExpression)) {
          this.refactorCallExpression(callExpression, usedNames, sourceFile);
        }
      });
  };

  private static refactorCallExpression = (callExpression: CallExpression, usedNames: string[], sourceFile: SourceFile): void => {
    const importId = ImportValidator.callExpressionFirstArgument(callExpression);
    const parent = callExpression.getParent();
    if (Node.isExpressionStatement(parent)) {
      return ExpressionImportsRefactor.addExpressionStatementImport(parent, importId, sourceFile);
    }
    if (Node.isVariableDeclaration(parent)) {
      return DeclarationImportRefactor.addVariableDeclarationImport(parent, importId, usedNames, sourceFile);
    }
    return CallImportsRefactor.addCallExpressionImport(callExpression, importId, usedNames, sourceFile);
  };
}

export default ImportsRefactor;
