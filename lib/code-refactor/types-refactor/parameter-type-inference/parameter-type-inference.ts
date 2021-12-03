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
  PropertyDeclaration,
  SetAccessorDeclaration,
} from "ts-morph";
import {TypeHandler} from "../type-handler/type-handler";
import {TypeChecker} from "../helpers/type-checker/type-checker";
import {TypeInferenceValidator} from "./type-inference-validator/type-inference-validator";

export class ParameterTypeInference {
  static inferSetAccessorParameterTypes = (setter: SetAccessorDeclaration) => {
    setter.findReferencesAsNodes().forEach(ref => {
      const parent = TypeInferenceValidator.validateSetAccessorParent(ref);
      const binary = TypeInferenceValidator.getBinaryAssignmentExpression(parent);
      binary && this.inferParameterTypes(setter.getParameters(), [binary.getRight()]);
    });
  }

  static inferFunctionAssignmentParameterTypes = (assignment: PropertyAssignment | VariableDeclaration | PropertyDeclaration) => {
    const initializer = assignment.getInitializer();
    const nameNode = assignment.getNameNode();
    if (Node.isIdentifier(nameNode) && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
      const parameters = initializer.getParameters();
      this.inferFunctionExpressionParameterTypes(nameNode, parameters);
    }
  }

  static inferFunctionDeclarationParameterTypes = (declaration: FunctionDeclaration | MethodDeclaration) => {
    declaration.findReferencesAsNodes().forEach(ref => {
      const parent = TypeInferenceValidator.validateCallExpressionParent(ref);
      const expression = TypeInferenceValidator.getCallExpression(parent);
      expression && this.inferParameterTypes(declaration.getParameters(), expression.getArguments());
    });
  }

  static inferConstructorParameterTypes = (declaration:  ConstructorDeclaration) => {
    declaration.findReferencesAsNodes().forEach(ref => {
      const parent = TypeInferenceValidator.getNewExpression(ref.getParent());
      parent && this.inferParameterTypes(declaration.getParameters(), parent.getArguments());
    });
  }

  private static inferFunctionExpressionParameterTypes = (identifier: Identifier, parameters: ParameterDeclaration[]) => {
    identifier.findReferencesAsNodes().forEach(ref => {
      const parent = TypeInferenceValidator.validateCallExpressionParent(ref);
      const expression = TypeInferenceValidator.getCallExpression(parent);
      expression && this.inferParameterTypes(parameters, expression.getArguments());
    });
  }

  private static inferParameterTypes = (parameters: ParameterDeclaration[], _arguments: Node[]) => {
    parameters.forEach((parameter, i) => {
      if (i < _arguments.length && i + 1 <= parameters.length && parameter.isRestParameter()) {
        this.setRestParameterType(parameter, _arguments.slice(i));
      } else if (i < _arguments.length) {
        this.setParameterType(parameter, _arguments[i]);
      } else if (!parameter.isOptional()) {
        parameter.setHasQuestionToken(true);
      }
    });
  }

  private static setRestParameterType = (parameter: ParameterDeclaration, _arguments: Node[]) => {
    const typeNodeType = parameter.getTypeNode()?.getType();
    const parameterType = (typeNodeType && !TypeChecker.isAny(typeNodeType) && typeNodeType.isArray()) ?
      typeNodeType.getArrayElementTypeOrThrow() : TypeHandler.getType(parameter).getArrayElementTypeOrThrow();

    const parameterArrayType = TypeHandler.getFilteredUnionTypes(parameterType);
    const filteredParameterType = parameterArrayType.filter(t => !TypeChecker.isAny(t)).map(t => t.getText());

    const uniqueArgumentTypes = _arguments.reduce((list, node) => {
      const type = node.getType().getBaseTypeOfLiteralType();
      if (!list.includes(type.getText()) && !TypeChecker.isAny(type) && !filteredParameterType.includes(type.getText()))
        return list.concat(type.getText());
      return list;
    }, new Array<string>());

    if (uniqueArgumentTypes.length <= 0) {
      return;
    }
    if (TypeChecker.isAny(parameterType) && uniqueArgumentTypes.length === 1 && !(/[&| ]+/).test(uniqueArgumentTypes[0].trim())) {
      TypeHandler.setSimpleType(parameter, `${uniqueArgumentTypes[0]}[]`);
    } else if (TypeChecker.isAny(parameterType)) {
      TypeHandler.setSimpleType(parameter, `(${uniqueArgumentTypes.join(' | ')})[]`);
    } else {
      TypeHandler.setSimpleType(parameter, `(${parameterType} | ${uniqueArgumentTypes.join(' | ')})[]`);
    }
  }

  private static setParameterType = (parameter: ParameterDeclaration, argument: Node) => {
    const argumentType = TypeHandler.getType(argument).getBaseTypeOfLiteralType();
    const typeNodeType = parameter.getTypeNode()?.getType();
    const parameterType = typeNodeType && !TypeChecker.isAny(typeNodeType) ? typeNodeType : TypeHandler.getType(parameter).getBaseTypeOfLiteralType();

    if (TypeChecker.isAny(argumentType)) {
      return;
    }
    if (TypeChecker.isAny(parameterType)) {
      return TypeHandler.setType(parameter, argumentType);
    }
    const type = this.getUniqueTypes(parameterType, argumentType);
    return TypeHandler.setSimpleType(parameter, type);
  }

  private static getUniqueTypes = (parameterType: Type, argumentType: Type): string => {
    const parameterUnionTypes = TypeHandler.getFilteredUnionTypes(parameterType);
    const argumentUnionTypes = TypeHandler.getFilteredUnionTypes(argumentType);
    const filtered = argumentUnionTypes.filter(a => !parameterUnionTypes.find(u => u.getText() === a.getText()));

    if (filtered.length <= 0) {
      return parameterType.getText();
    }
    if (filtered >= argumentUnionTypes) {
      return `${parameterType.getText()} | ${argumentType.getText()}`;
    } else {
      const parameterTypes = parameterUnionTypes.map(union => union.getBaseTypeOfLiteralType().getText());
      const filteredArguments = argumentType.getText().split('|').filter(a => !parameterTypes.includes(a.trim())).join(' | ');
      return `${parameterType.getText()} | ${filteredArguments}`;
    }
  }
}
