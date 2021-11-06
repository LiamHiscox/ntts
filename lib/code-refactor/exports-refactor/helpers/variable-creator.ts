import {BinaryExpression, Identifier, SourceFile, VariableDeclarationKind} from "ts-morph";

export class VariableCreator {
  static createVariable(identifier: Identifier, binary: BinaryExpression, declarationKind: VariableDeclarationKind, sourceFile: SourceFile) {
    sourceFile.insertVariableStatement(
      binary.getChildIndex(),
      {
        declarationKind,
        declarations: [{
          initializer: binary.getRight().getText(),
          name: identifier.getText(),
        }],
      })
  }

  static createEmptyVariable(identifier: Identifier, binary: BinaryExpression, declarationKind: VariableDeclarationKind, sourceFile: SourceFile) {
    sourceFile.insertVariableStatement(
      binary.getChildIndex(),
      {
        declarationKind,
        declarations: [{
          name: identifier.getText()
        }],
      })
  }
}
