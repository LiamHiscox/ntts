import {CallExpression, ExpressionStatement, SourceFile, SyntaxKind, VariableDeclaration} from "ts-morph";
import {ImportValidator} from "./helpers/import-validator";
import {BinaryImportsRefactor} from "./binary-import-refactor/binary-imports-refactor";
import {ExpressionImportsRefactor} from "./expression-import-refactor/expression-imports-refactor";
import {CallImportsRefactor} from "./call-import-refactor/call-imports-refactor";
import {DeclarationImportRefactor} from "./declaration-import-refactor/declaration-import-refactor";

export class ImportsRefactor {
  static requiresToImports(sourceFile: SourceFile) {
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpression => {
      if (!callExpression.wasForgotten() && ImportValidator.validRequire(callExpression)) {
        this.refactorCallExpression(callExpression, sourceFile);
      }
    })
  }

  private static refactorCallExpression(callExpression: CallExpression, sourceFile: SourceFile) {
    const importId = ImportValidator.callExpressionFirstArgument(callExpression);

    switch (callExpression.getParent()?.getKind()) {
      case SyntaxKind.BinaryExpression:
        BinaryImportsRefactor.addBinaryExpressionImport(callExpression, importId, sourceFile);
        break;
      case SyntaxKind.ExpressionStatement:
        const expression = callExpression.getParent()! as ExpressionStatement;
        ExpressionImportsRefactor.addExpressionStatementImport(expression, importId, sourceFile)
        break;
      case SyntaxKind.CallExpression:
        CallImportsRefactor.addCallExpressionImport(callExpression, importId, sourceFile)
        break;
      case SyntaxKind.VariableDeclaration:
        const declaration = callExpression.getParent()! as VariableDeclaration;
        DeclarationImportRefactor.addVariableDeclarationImport(declaration, importId, sourceFile);
        break;
    }
  }
}
