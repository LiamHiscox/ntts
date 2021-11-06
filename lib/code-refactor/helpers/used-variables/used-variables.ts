import {SourceFile, SyntaxKind} from "ts-morph";

export class UsedVariables {
  static getDeclaredVariables (sourceFile: SourceFile) {
    sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration).map(descendant => descendant.getNameNode())
  }
}
