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
import {Logger} from "../../logger/logger";
import {TypeHandler} from "./type-handler/type-handler";

export class TypesRefactor {
  static declareInitialTypes = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath())
    sourceFile.getDescendants().forEach(descendant => {
      switch (!descendant.wasForgotten() && descendant.getKind()) {
        case SyntaxKind.VariableDeclaration:
        case SyntaxKind.PropertyDeclaration:
          const variable = descendant.asKind(SyntaxKind.PropertyDeclaration)
            || descendant.asKindOrThrow(SyntaxKind.VariableDeclaration);
          return TypesRefactor.refactorVariableOrProperty(variable);
        case SyntaxKind.ArrowFunction:
          const arrowFunction = descendant.asKindOrThrow(SyntaxKind.ArrowFunction);
          return TypesRefactor.refactorArrowFunction(arrowFunction);
        case SyntaxKind.FunctionExpression:
        case SyntaxKind.FunctionDeclaration:
        case SyntaxKind.MethodDeclaration:
        case SyntaxKind.GetAccessor:
        case SyntaxKind.SetAccessor:
          const _function = descendant.asKind(SyntaxKind.FunctionExpression)
            || descendant.asKind(SyntaxKind.FunctionDeclaration)
            || descendant.asKind(SyntaxKind.MethodDeclaration)
            || descendant.asKind(SyntaxKind.GetAccessor)
            || descendant.asKindOrThrow(SyntaxKind.SetAccessor);
          return TypesRefactor.refactorFunction(_function);
      }
    })
  }

  private static refactorArrowFunction = (arrowFunction: ArrowFunction) => {
    if (arrowFunction.getParameters().length === 1) {
      const index = arrowFunction.getEqualsGreaterThan().getChildIndex();
      const argumentList = arrowFunction.getChildren().filter((_, i) => i < index);
      if (argumentList.length === 1) {
        const newArrowFunction = argumentList[0]
          .replaceWithText(`(${argumentList[0].getText()})`)
          .getParentIfKindOrThrow(SyntaxKind.ArrowFunction);
        return TypesRefactor.refactorFunction(newArrowFunction);
      }
    }
    return TypesRefactor.refactorFunction(arrowFunction);
  }

  private static refactorVariableOrProperty = (declaration: VariableDeclaration | PropertyDeclaration) => {
    const initializer = declaration.getInitializer();
    switch (initializer?.getKind()) {
      case SyntaxKind.ArrowFunction:
      case SyntaxKind.ClassExpression:
      case SyntaxKind.FunctionExpression:
        return;
      default:
        const type = TypeHandler.getType(declaration);
        if (type.isLiteral()) {
          TypeHandler.setType(declaration, type.getBaseTypeOfLiteralType());
        } else if (!type.isAny()) {
          TypeHandler.setType(declaration, type);
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
      const type = TypeHandler.getType(parameter);
      if (type.isLiteral()) {
        TypeHandler.setType(parameter, type.getBaseTypeOfLiteralType());
      } else if (!type.isAny()) {
        TypeHandler.setType(parameter, type);
      }
    });
  }
}
