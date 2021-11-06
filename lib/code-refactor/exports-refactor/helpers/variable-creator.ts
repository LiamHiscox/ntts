import {SourceFile, VariableDeclarationKind} from "ts-morph";

export class VariableCreator {
  static createVariable(name: string, index: number, initializer: string, declarationKind: VariableDeclarationKind, sourceFile: SourceFile) {
    sourceFile.insertVariableStatement(
      index,
      {
        declarationKind,
        declarations: [{initializer, name}]
      })
  }

  static createEmptyVariable(name: string, index: number, declarationKind: VariableDeclarationKind, sourceFile: SourceFile) {
    sourceFile.insertVariableStatement(
      index,
      {
        declarationKind,
        declarations: [{name}]
      })
  }
}
