import {
  Node,
  FunctionDeclaration,
  ParameterDeclaration,
  MethodDeclaration,
  ConstructorDeclaration,
  PropertyAssignment,
  VariableDeclaration,
  PropertyDeclaration,
  SetAccessorDeclaration,
} from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';
import TypeChecker from '../helpers/type-checker/type-checker';
import TypeInferenceValidator from './type-inference-validator/type-inference-validator';
import { findReferencesAsNodes } from '../../helpers/reference-finder/reference-finder';
import DeepTypeInference from '../deep-type-inference/deep-type-inference';
import TypeSimplifier from '../helpers/type-simplifier/type-simplifier';

class ParameterTypeInference {
  static inferSetAccessorParameterTypes = (setter: SetAccessorDeclaration) => {
    findReferencesAsNodes(setter).forEach((ref) => {
      const parent = TypeInferenceValidator.validateSetAccessorParent(ref);
      const binary = TypeInferenceValidator.getBinaryAssignmentExpression(parent);
      binary && this.inferParameterTypes(setter.getParameters(), [binary.getRight()]);
    });
    const parameters = setter.getParameters();
    this.simplifyParameterTypes(parameters);
    DeepTypeInference.propagateParameterTypes(parameters);
  };

  static inferFunctionAssignmentParameterTypes = (assignment: PropertyAssignment | VariableDeclaration | PropertyDeclaration) => {
    const initializer = assignment.getInitializer();
    const nameNode = assignment.getNameNode();
    if (!Node.isArrayBindingPattern(nameNode)
      && !Node.isObjectBindingPattern(nameNode)
      && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
      const parameters = initializer.getParameters();
      this.inferFunctionExpressionParameterTypes(assignment, parameters);
      this.simplifyParameterTypes(parameters);
      DeepTypeInference.propagateParameterTypes(parameters);
    }
  };

  static inferFunctionDeclarationParameterTypes = (declaration: FunctionDeclaration | MethodDeclaration) => {
    const initialTypes = declaration.getParameters().map((p) => p.getType().getText());
    findReferencesAsNodes(declaration).forEach((ref) => {
      const parent = TypeInferenceValidator.validateCallExpressionParent(ref);
      const expression = TypeInferenceValidator.getCallExpression(parent);
      expression && this.inferParameterTypes(declaration.getParameters(), expression.getArguments());
    });
    this.simplifyParameterTypes(declaration.getParameters());
    const parameters = declaration.getParameters().filter((p, i) =>
      !TypeChecker.isAnyOrUnknown(p.getType()) && initialTypes[i] !== p.getType().getText());
    DeepTypeInference.propagateParameterTypes(parameters);
  };

  static inferConstructorParameterTypes = (declaration: ConstructorDeclaration) => {
    findReferencesAsNodes(declaration).forEach((ref) => {
      const parent = TypeInferenceValidator.getNewExpression(ref.getParent());
      parent && this.inferParameterTypes(declaration.getParameters(), parent.getArguments());
    });
    const parameters = declaration.getParameters();
    this.simplifyParameterTypes(parameters);
    DeepTypeInference.propagateParameterTypes(parameters);
  };

  private static simplifyParameterTypes = (parameters: ParameterDeclaration[]) => {
    parameters.forEach((parameter) => {
      const simplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getTypeNode(parameter));
      simplified && TypeHandler.setTypeFiltered(parameter, simplified);
    });
  };

  private static inferFunctionExpressionParameterTypes = (
    assignment: PropertyAssignment | VariableDeclaration | PropertyDeclaration,
    parameters: ParameterDeclaration[],
  ) => {
    findReferencesAsNodes(assignment).forEach((ref) => {
      const parent = TypeInferenceValidator.validateCallExpressionParent(ref);
      const expression = TypeInferenceValidator.getCallExpression(parent);
      expression && this.inferParameterTypes(parameters, expression.getArguments());
    });
  };

  private static inferParameterTypes = (parameters: ParameterDeclaration[], _arguments: Node[]) => {
    parameters.forEach((parameter, i) => {
      if (i < _arguments.length && i + 1 <= parameters.length && parameter.isRestParameter()) {
        this.setRestParameterType(parameter, _arguments.slice(i));
      } else if (i < _arguments.length) {
        this.setParameterType(parameter, _arguments[i]);
      } else if (!parameter.hasQuestionToken()) {
        parameter.setHasQuestionToken(true);
      }
    });
  };

  private static setRestParameterType = (parameter: ParameterDeclaration, _arguments: Node[]) => {
    const parameterType = TypeHandler.getType(parameter).getArrayElementType()
      || TypeHandler.getType(TypeHandler.setTypeFiltered(parameter, 'any[]')).getArrayElementTypeOrThrow();
    const parameterArrayType = TypeHandler.getFilteredUnionTypes(parameterType);
    const filteredParameterType = parameterArrayType.filter((t) => !TypeChecker.isAny(t)).map((t) => t.getText());

    const uniqueArgumentTypes = _arguments.reduce((list: string[], node) => {
      const type = TypeHandler.getType(node);
      if (!list.includes(type.getText()) && !TypeChecker.isAny(type) && !filteredParameterType.includes(type.getText())) {
        return list.concat(type.getText());
      }
      return list;
    }, []);

    const newType = TypeHandler.combineTypeWithList(parameterType, ...uniqueArgumentTypes);
    newType && TypeHandler.setTypeFiltered(parameter, `(${newType})[]`);
  };

  private static setParameterType = (parameter: ParameterDeclaration, argument: Node) => {
    const type = TypeHandler.combineTypes(TypeHandler.getType(parameter), TypeHandler.getType(argument));
    return TypeHandler.setTypeFiltered(parameter, type);
  };
}

export default ParameterTypeInference;
