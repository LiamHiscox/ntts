import {
  CallExpression,
  ExpressionStatement,
  SourceFile,
  SyntaxKind,
  VariableDeclaration
} from "ts-morph";
import {ImportValidator} from "./helpers/import-validator";
import {ExpressionImportsRefactor} from "./expression-import-refactor/expression-imports-refactor";
import {CallImportsRefactor} from "./call-import-refactor/call-imports-refactor";
import {DeclarationImportRefactor} from "./declaration-import-refactor/declaration-import-refactor";
import {UsedNames} from "../helpers/used-names/used-names";
import {ImportClauseRefactor} from "./import-clause-refactor/import-clause-refactor";
import {ModuleSpecifierRefactorModel} from "../../models/module-specifier-refactor.model";
import {TsconfigHandler} from "../../tsconfig-handler/tsconfig-handler";
import {ImportsReformat} from "./imports-reformat/imports-reformat";
import {ModuleDeclarator} from "../../module-declarator/module-declarator";

export class ImportsRefactor {
  static refactorImportClauses = (sourceFile: SourceFile) => {
    const importDeclarations = UsedNames.getDeclaredImportNames(sourceFile);
    sourceFile.getImportDeclarations().reduce((usedNames, importStatement) => {
      return ImportClauseRefactor.refactorImportClause(importStatement, usedNames, sourceFile);
    }, importDeclarations);
  }

  static reformatImports = (sourceFile: SourceFile, moduleSpecifierResult: ModuleSpecifierRefactorModel): ModuleSpecifierRefactorModel => {
    return sourceFile
      .getImportDeclarations()
      .reduce((moduleSpecifierRefactor: ModuleSpecifierRefactorModel, importStatement) =>
        ImportsReformat.refactorModuleSpecifier(importStatement, moduleSpecifierRefactor), moduleSpecifierResult);
  }

  static resolveModuleSpecifierResults = (moduleSpecifierResult: ModuleSpecifierRefactorModel) => {
    ModuleDeclarator.handleUntypedPackages(moduleSpecifierResult.fileEndings, true);
    if (moduleSpecifierResult.allowJs || moduleSpecifierResult.allowJson) {
      TsconfigHandler.addCompilerOptions(moduleSpecifierResult);
    }
  }

  static requiresToImports = (sourceFile: SourceFile) => {
    const usedNames = UsedNames.getDeclaredNames(sourceFile);
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpression => {
      if (!callExpression.wasForgotten() && ImportValidator.validRequire(callExpression)) {
        this.refactorCallExpression(callExpression, usedNames, sourceFile);
      }
    })
  }

  private static refactorCallExpression = (callExpression: CallExpression, usedNames: string[], sourceFile: SourceFile) => {
    const importId = ImportValidator.callExpressionFirstArgument(callExpression);

    switch (callExpression.getParent()?.getKind()) {
      case SyntaxKind.ExpressionStatement:
        const expression = callExpression.getParent()! as ExpressionStatement;
        ExpressionImportsRefactor.addExpressionStatementImport(expression, importId, sourceFile);
        break;
      case SyntaxKind.VariableDeclaration:
        const declaration = callExpression.getParent()! as VariableDeclaration;
        DeclarationImportRefactor.addVariableDeclarationImport(declaration, importId, usedNames, sourceFile);
        break;
      default:
        CallImportsRefactor.addCallExpressionImport(callExpression, importId, usedNames, sourceFile);
        break;
    }
  }
}
