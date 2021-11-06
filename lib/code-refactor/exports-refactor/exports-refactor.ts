import {BinaryExpression, SourceFile, SyntaxKind, VariableDeclarationKind} from "ts-morph";
import {VariableCreator} from "./helpers/variable-creator";
import {ExportValidator} from "./helpers/export-validator";
import {ExportParser} from "./helpers/export-parser";

export class ExportsRefactor {
  static moduleExportsToExport(sourceFile: SourceFile) {
/*
    const declaredVariables = sourceFile
      .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
      .map(declaration => declaration.getNameNode());
 */
    sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression).forEach(node => {
      if (!node.wasForgotten()) {
        this.refactorExport(node, sourceFile);
      }
    });
  }

  private static refactorExport(binary: BinaryExpression, sourceFile: SourceFile) {
    const identifiers = ExportValidator.isExportAssigment(binary);
    if (identifiers) {
      const filtered = ExportParser.filterExportIdentifiers(identifiers);
      switch (filtered.length) {
        case 0:
          // export default or assignment of multiple exports
          break;
        case 1:
          const identifier = filtered[0];
          const parent = binary.getParent()?.asKind(SyntaxKind.ExpressionStatement);
          if (parent && binary.getIndentationLevel() === 0) {
            VariableCreator.createVariable(identifier, binary, VariableDeclarationKind.Const, sourceFile);
            parent.remove();
          } else {
            VariableCreator.createEmptyVariable(identifier, binary, VariableDeclarationKind.Let, sourceFile);
            binary.getLeft().replaceWithText(identifier.getText());
          }
          break;
        default:
          break;
      }
    }
  }
}

