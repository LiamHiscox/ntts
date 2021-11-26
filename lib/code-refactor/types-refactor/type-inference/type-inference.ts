import {
  Node,
  FunctionDeclaration,
  ParameterDeclaration,
  Type,
  Identifier,
  MethodDeclaration,
  ConstructorDeclaration,
  PropertyAssignment,
  VariableDeclaration,
  PropertyDeclaration, CallExpression, NewExpression
} from "ts-morph";
import {TypeHandler} from "../type-handler/type-handler";

export class TypeInference {
  static inferFunctionAssignmentParameterTypes = (assignment: PropertyAssignment | VariableDeclaration | PropertyDeclaration) =>  {
    const initializer = assignment.getInitializer();
    const nameNode = assignment.getNameNode();
    if (Node.isIdentifier(nameNode) && (Node.isArrowFunction(initializer) || Node.isFunctionDeclaration(initializer))) {
      const parameters = initializer.getParameters();
      this.inferFunctionExpressionParameterTypes(nameNode, parameters);
    }
  }

  static inferFunctionDeclarationParameterTypes = (declaration: FunctionDeclaration | MethodDeclaration | ConstructorDeclaration) => {
    declaration.findReferencesAsNodes().forEach(ref => {
      const parent = this.getCallOrNewExpression(ref.getParent());
      if (parent) {
        this.inferParameterTypes(declaration.getParameters(), parent.getArguments());
      }
    });
  }

  private static inferFunctionExpressionParameterTypes = (identifier: Identifier, parameters: ParameterDeclaration[]) => {
    identifier.findReferencesAsNodes().forEach(ref => {
      const parent = this.getCallOrNewExpression(ref.getParent());
      if (parent) {
        this.inferParameterTypes(parameters, parent.getArguments());
      }
    });
  }

  private static getCallOrNewExpression = (node: Node | undefined): CallExpression | NewExpression | undefined => {
    if (Node.isCallExpression(node) || Node.isNewExpression(node))
      return node;
    if (!Node.isPropertyAccessExpression(node) || !node || !node.getParent())
      return;
    return this.getCallOrNewExpression(node.getParentOrThrow());
  }

  private static inferParameterTypes = (parameters: ParameterDeclaration[], _arguments: Node[]) => {
    parameters.forEach((parameter, i) => {
      if (i < _arguments.length) {
        this.setParameterType(parameter, _arguments[i]);
      } else if (!parameter.isOptional()) {
        parameter.setHasQuestionToken(true);
      }
    });
  }

  private static setParameterType = (parameter: ParameterDeclaration, argument: Node) => {
    const argumentType = TypeHandler.getType(argument).getBaseTypeOfLiteralType();
    const typeNodeType = parameter.getTypeNode()?.getType();
    const parameterType = typeNodeType && !typeNodeType.isAny() ? typeNodeType : TypeHandler.getType(parameter).getBaseTypeOfLiteralType();

    if (argumentType.isAny()) {
      return;
    }
    if (parameterType.isAny()) {
      return TypeHandler.setType(parameter, argumentType);
    }
    if (!parameterType.isAny()) {
      const type = this.getUniqueTypes(parameterType, argumentType);
      return TypeHandler.setSimpleType(parameter, type);
    }

    return;
  }

  private static getUniqueTypes = (parameterType: Type, argumentType: Type): string => {
    const parameterUnionTypes = parameterType.isUnion() ? parameterType.getUnionTypes() : [parameterType];
    const argumentUnionTypes = argumentType.isUnion() ? argumentType.getUnionTypes() : [argumentType];
    const filtered = argumentUnionTypes.filter(a => !parameterUnionTypes.includes(a));

    if (filtered.length <= 0) {
      return parameterType.getText();
    }
    if (filtered >= argumentUnionTypes) {
      return `${parameterType.getText()} | ${argumentType.getText()}`;
    }
    else {
      const parameterTypes = parameterUnionTypes.map(union => union.getBaseTypeOfLiteralType().getText());
      const filteredArguments = argumentType.getText().split('|').filter(a => !parameterTypes.includes(a.trim())).join(' | ');
      return `${parameterType.getText()} | ${filteredArguments}`;
    }
  }
}
