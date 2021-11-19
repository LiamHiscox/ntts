import {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  GetAccessorDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  SetAccessorDeclaration,
  SourceFile,
  SyntaxKind,
  VariableDeclaration
} from "ts-morph";

export class TypesRefactor {
  static declareInitialTypes = (sourceFile: SourceFile) => {
    sourceFile.getDescendants().forEach(descendant => {
      switch (descendant.getKind()) {
        case SyntaxKind.VariableDeclaration:
        case SyntaxKind.PropertyDeclaration:
          const variable = descendant.asKind(SyntaxKind.PropertyDeclaration)
            || descendant.asKindOrThrow(SyntaxKind.VariableDeclaration);
          return TypesRefactor.refactorVariableOrProperty(variable);
        case SyntaxKind.ArrowFunction:
        case SyntaxKind.FunctionExpression:
        case SyntaxKind.FunctionDeclaration:
        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.GetAccessor:
        case SyntaxKind.SetAccessor:
          const _function = descendant.asKind(SyntaxKind.ArrowFunction)
            || descendant.asKind(SyntaxKind.FunctionExpression)
            || descendant.asKind(SyntaxKind.FunctionDeclaration)
            || descendant.asKind(SyntaxKind.MethodDeclaration)
            || descendant.asKind(SyntaxKind.GetAccessor)
            || descendant.asKindOrThrow(SyntaxKind.SetAccessor);
          return TypesRefactor.refactorFunction(_function);
      }
    })
  }

  private static refactorVariableOrProperty = (declaration: VariableDeclaration | PropertyDeclaration) => {
    const initializer = declaration.getInitializer();
    debugger;
    switch (initializer?.getKind()) {
      case SyntaxKind.ArrowFunction:
      case SyntaxKind.ClassExpression:
      case SyntaxKind.FunctionExpression:
        return;
      default:
        const type = declaration.getType();
        debugger;
        if (type.isLiteral()) {
          declaration.setType(type.getBaseTypeOfLiteralType().getText());
        } else if (!type.isAny()) {
          declaration.setType(type.getText());
        }
    }
  }

  private static refactorFunction = (_function: FunctionDeclaration | FunctionExpression | ArrowFunction | MethodDeclaration | GetAccessorDeclaration | SetAccessorDeclaration) => {
    const returnType = _function.getReturnType();
    if (returnType.isLiteral()) {
      _function.setReturnType(returnType.getBaseTypeOfLiteralType().getText());
    } else if (!returnType.isAny()) {
      _function.setReturnType(returnType.getText());
    }

    _function.getParameters().forEach(parameter => {
      const type = parameter.getType();
      if (type.isLiteral()) {
        parameter.setType(type.getBaseTypeOfLiteralType().getText());
      } else if (!type.isAny()) {
        parameter.setType(type.getText());
      }
    });
  }
}
