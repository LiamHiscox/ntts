import {
  CallExpression,
  ExpressionStatement,
  ImportDeclaration,
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
import {FileRename} from "../../file-rename/file-rename";
import { join } from "path";
import {existsSync} from "fs";

export class ImportsRefactor {
  static requiresToImports(sourceFile: SourceFile) {
    const usedNames = UsedNames.getDeclaredName(sourceFile);
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpression => {
      if (!callExpression.wasForgotten() && ImportValidator.validRequire(callExpression)) {
        this.refactorCallExpression(callExpression, usedNames, sourceFile);
      }
    })
    sourceFile.getImportDeclarations().forEach(importStatement => {
      this.refactorModuleSpecifier(importStatement, sourceFile);
    });
  }

  private static refactorCallExpression(callExpression: CallExpression, usedNames: string[], sourceFile: SourceFile) {
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

  private static refactorModuleSpecifier(importStatement: ImportDeclaration, sourceFile: SourceFile) {
    const moduleSpecifier = importStatement.getModuleSpecifier();
    if (importStatement.isModuleSpecifierRelative() && FileRename.isJavaScriptFile(moduleSpecifier.getLiteralValue())) {
      const renamedSpecifier = FileRename.replaceEnding(moduleSpecifier.getLiteralValue());
      const fullPath = join(sourceFile.getDirectoryPath(), renamedSpecifier);
      existsSync(`${fullPath}.ts`) && importStatement.setModuleSpecifier(renamedSpecifier);
    }
    if (!importStatement.isModuleSpecifierRelative() && FileRename.isJavaScriptFile(moduleSpecifier.getLiteralValue())) {
      const renamedSpecifier = FileRename.replaceEnding(moduleSpecifier.getLiteralValue());
      importStatement.setModuleSpecifier(renamedSpecifier);
    }
  }
}
