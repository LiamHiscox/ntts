import {
  ClassDeclaration,
  FunctionDeclaration,
  ImportClause,
  Node,
  ParameterDeclaration,
  SourceFile,
  SyntaxKind,
  VariableDeclaration
} from "ts-morph";
import {VariableParser} from "../variable-parser/variable-parser";

export class UsedNames {
  static getDeclaredImportNames = (sourceFile: SourceFile): string[] => {
    return sourceFile
      .getDescendantsOfKind(SyntaxKind.ImportClause)
      .reduce((names, clause) => names.concat(this.parseImportClause(clause)), new Array<string>());
  }

  static getDeclaredNames = (sourceFile: SourceFile): string[] => {
    return sourceFile.getDescendants().reduce((variableNames, descendant) => {
      if (Node.isImportClause(descendant))
        return variableNames.concat(this.parseImportClause(descendant));
      if (Node.isClassDeclaration(descendant)
        || Node.isFunctionDeclaration(descendant)
      ) return this.parseFunctionOrClass(descendant, variableNames);
      if (Node.isParameterDeclaration(descendant)
        || Node.isVariableDeclaration(descendant)
      ) return variableNames.concat(this.parseParameterOrVariable(descendant));

      return variableNames;
    }, new Array<string>())
  }

  private static parseImportClause = (importClause: ImportClause): string[] => {
    return [
      importClause.getDefaultImport()?.getText() || '',
      importClause.getNamespaceImport()?.getText() || '',
      ...importClause.getNamedImports().map(named => named.getAliasNode()?.getText() || named.getNameNode().getText())
    ].filter(variableName => !!variableName);
  }

  private static parseParameterOrVariable = (variable: ParameterDeclaration | VariableDeclaration): string[] | string => {
    if (Node.isIdentifier(variable.getNameNode())) {
      return variable.getNameNode().getText();
    }
    return VariableParser.getIdentifiers(variable.getNameNode()).map(i => i.getText());
  }

  private static parseFunctionOrClass = (declaration: ClassDeclaration | FunctionDeclaration, variableNames: string[]): string[] => {
    const nodeName = declaration.getName();
    return nodeName ? variableNames.concat(nodeName) : variableNames;
  }
}
