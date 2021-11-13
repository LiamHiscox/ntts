import {
  CallExpression,
  ExpressionStatement,
  SourceFile,
  SyntaxKind,
  VariableDeclaration
} from "ts-morph";
import {ImportValidator} from "./helpers/import-validator";
import {BinaryImportsRefactor} from "./binary-import-refactor/binary-imports-refactor";
import {ExpressionImportsRefactor} from "./expression-import-refactor/expression-imports-refactor";
import {CallImportsRefactor} from "./call-import-refactor/call-imports-refactor";
import {DeclarationImportRefactor} from "./declaration-import-refactor/declaration-import-refactor";
import {UsedNames} from "../helpers/used-names/used-names";
import {ImportClauseRefactor} from "./import-clause-refactor/import-clause-refactor";
import {ModuleSpecifierRefactorModel} from "../../models/module-specifier-refactor.model";
import {writeFileSync} from "fs";
import {TsconfigHandler} from "../../tsconfig-handler/tsconfig-handler";
import {ImportsReformat} from "./imports-reformat/imports-reformat";

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
        ImportsReformat.refactorModuleSpecifier(importStatement, moduleSpecifierRefactor, sourceFile), moduleSpecifierResult);
  }

  static resolveModuleSpecifierResults = (moduleSpecifierResult: ModuleSpecifierRefactorModel) => {
    if (moduleSpecifierResult.declareFileEndingModules.length > 0 || moduleSpecifierResult.declareModules.length > 0) {
      const modules1 = new Set(moduleSpecifierResult.declareFileEndingModules.map(file => `declare module "*.${file}";`));
      const modules2 = new Set(moduleSpecifierResult.declareModules.map(mod => `declare module "${mod}";`));
      const moduleFile = './ntts-modules.d.ts';
      writeFileSync(moduleFile, Array.from(modules1).concat(Array.from(modules2)).join('\n'));
      TsconfigHandler.addModuleFile('./ntts-modules.d.ts');
    }
    if (moduleSpecifierResult.allowJs || moduleSpecifierResult.allowJson) {
      TsconfigHandler.addCompilerOptions(moduleSpecifierResult);
    }
  }

  static requiresToImports = (sourceFile: SourceFile) => {
    const usedNames = UsedNames.getDeclaredNames(sourceFile);
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpression => {
      if (callExpression.getText().startsWith('require')) {
        console.log(callExpression.getText());
        console.log('wasForgotten', callExpression.wasForgotten());
        console.log('validRequire', ImportValidator.validRequire(callExpression));
      }
      if (!callExpression.wasForgotten() && ImportValidator.validRequire(callExpression)) {
        this.refactorCallExpression(callExpression, usedNames, sourceFile);
      }
    })
  }

  private static refactorCallExpression = (callExpression: CallExpression, usedNames: string[], sourceFile: SourceFile) => {
    const importId = ImportValidator.callExpressionFirstArgument(callExpression);

    switch (callExpression.getParent()?.getKind()) {
      case SyntaxKind.BinaryExpression:
        BinaryImportsRefactor.addBinaryExpressionImport(callExpression, importId, usedNames, sourceFile);
        break;
      case SyntaxKind.ExpressionStatement:
        const expression = callExpression.getParent()! as ExpressionStatement;
        ExpressionImportsRefactor.addExpressionStatementImport(expression, importId, sourceFile);
        break;
      case SyntaxKind.CallExpression:
        CallImportsRefactor.addCallExpressionImport(callExpression, importId, usedNames, sourceFile);
        break;
      case SyntaxKind.VariableDeclaration:
        const declaration = callExpression.getParent()! as VariableDeclaration;
        DeclarationImportRefactor.addVariableDeclarationImport(declaration, importId, usedNames, sourceFile);
        break;
    }
  }
}
