import {ExpressionStatement, SourceFile} from "ts-morph";
import {ImportCreator} from "../helpers/import-creator";

export class ExpressionImportsRefactor {
  static addExpressionStatementImport(
    expression: ExpressionStatement,
    importId: string,
    sourceFile: SourceFile,
  ) {
    ImportCreator.addEmptyImport(importId, sourceFile);
    expression.remove();
  }
}
