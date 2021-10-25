import {
  CallExpression,
  Node,
  SourceFile,
  StringLiteral,
  SyntaxKind,
  VariableDeclaration,
  VariableDeclarationKind,
  VariableStatement
} from "ts-morph";
import {VariableNameGenerator} from "./helpers/variable-name-generator";
import {ImportValidator} from "./helpers/import-validator";

export class ImportsRefactor {
  static requiresToImports(sourceFile: SourceFile) {
    sourceFile
      .getVariableStatements()
      .forEach(statement => ImportsRefactor.forEachVariableDeclarations(statement, sourceFile));
  }

  private static forEachVariableDeclarations(statement: VariableStatement, sourceFile: SourceFile) {
    statement
      .getDeclarations()
      .forEach(declaration => ImportsRefactor.refactorVariableDeclarations(declaration, statement.getDeclarationKind(), sourceFile));
  }

  private static refactorVariableDeclarations(declaration: VariableDeclaration, declarationKind: VariableDeclarationKind, sourceFile: SourceFile) {
    const initializer = declaration.getInitializerIfKind(SyntaxKind.CallExpression);
    if (initializer && ImportsRefactor.isRequire(initializer)) {
      ImportsRefactor.refactorValidRequire(initializer.getArguments(), declaration, declarationKind, sourceFile);
    }
  }

  private static refactorValidRequire(
    argumentList: Node[],
    declaration: VariableDeclaration,
    declarationKind: VariableDeclarationKind,
    sourceFile: SourceFile
  ) {
    if (argumentList && argumentList.length > 0 && argumentList[0].getKind() === SyntaxKind.StringLiteral) {
      const importId = (argumentList[0] as StringLiteral).getLiteralValue();
      this.addValidImport(importId, sourceFile, declarationKind, declaration);
      declaration.remove();
    }
  }

  private static addValidImport(
    importId: string,
    sourceFile: SourceFile,
    declarationKind: VariableDeclarationKind,
    declaration: VariableDeclaration
  ) {
    const importName = declaration.getName();
    if (ImportValidator.isValidImport(declaration)) {
      sourceFile.addImportDeclaration({
        defaultImport: importName,
        moduleSpecifier: importId
      });
    } else {
      const moduleVariableName = VariableNameGenerator.variableNameFromImportId(importId);
      const variableName = VariableNameGenerator.getUsableVariableName(moduleVariableName, sourceFile);
      const importDeclaration = sourceFile.addImportDeclaration({
        defaultImport: variableName,
        moduleSpecifier: importId
      });
      const index = importDeclaration.getEndLineNumber() + 1;
      sourceFile.insertVariableStatement(index, {
        declarationKind,
        declarations: [{
          name: importName,
          initializer: variableName,
        }],
      })
    }
  }

  private static isRequire = (initializer: CallExpression): boolean => {
    const identifiers = initializer.getChildrenOfKind(SyntaxKind.Identifier);
    return identifiers.length === 1 && identifiers[0].getText() === 'require';
  }
}
