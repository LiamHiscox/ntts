import {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  GetAccessorDeclaration,
  MethodDeclaration, Node,
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
      if (descendant.wasForgotten())
        return;
      if (Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
      ) return TypesRefactor.refactorVariableOrProperty(descendant);
      if (Node.isArrowFunction(descendant))
        return TypesRefactor.refactorArrowFunction(descendant);
      if (Node.isFunctionExpression(descendant)
        || Node.isFunctionDeclaration(descendant)
        || Node.isMethodDeclaration(descendant)
        || Node.isGetAccessorDeclaration(descendant)
        || Node.isSetAccessorDeclaration(descendant)
      ) return TypesRefactor.refactorFunction(descendant);
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
    if (!Node.isArrowFunction(initializer)
      && !Node.isClassExpression(initializer)
      && !Node.isFunctionExpression(initializer)
    ) {
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
