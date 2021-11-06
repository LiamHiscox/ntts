import {ImportClause, ParameterDeclaration, SourceFile, SyntaxKind, VariableDeclaration} from "ts-morph";
import {VariableParser} from "../variable-parser/variable-parser";

export class UsedVariables {
  static getDeclaredVariables(sourceFile: SourceFile): string[] {
    return sourceFile.getDescendants().reduce((variableNames, descendant) => {
      switch (descendant.getKind()) {
        case SyntaxKind.ImportClause:
          const importClause = descendant.asKindOrThrow(SyntaxKind.ImportClause);
          return variableNames.concat(this.parseImportClause(importClause));
        case SyntaxKind.Parameter:
        case SyntaxKind.VariableDeclaration:
          const typed = descendant.asKind(SyntaxKind.Parameter) || descendant.asKindOrThrow(SyntaxKind.VariableDeclaration);
          return variableNames.concat(this.parseParameterOrVariable(typed));
        default:
          return variableNames;
      }
    }, new Array<string>())
  }

  private static parseImportClause(importClause: ImportClause): string[] {
    return [
      importClause.getDefaultImport()?.getText() || '',
      importClause.getNamespaceImport()?.getText() || '',
      ...importClause.getNamedImports().map(named => named.getAliasNode()?.getText() || named.getNameNode().getText())
    ].filter(variableName => !!variableName);
  }

  private static parseParameterOrVariable(variable: ParameterDeclaration | VariableDeclaration): string[] | string {
    const identifier = variable.getNameNode().asKind(SyntaxKind.Identifier);
    if (identifier) {
      return identifier.getText();
    }
    return VariableParser.getIdentifiers(variable.getNameNode()).map(i => i.getText());
  }
}
