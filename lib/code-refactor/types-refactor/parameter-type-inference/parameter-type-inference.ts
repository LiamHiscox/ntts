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
  Project
} from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';
import TypeChecker from '../helpers/type-checker/type-checker';
import TypeInferenceValidator from './type-inference-validator/type-inference-validator';
import {findReferencesAsNodes} from '../../helpers/reference-finder/reference-finder';
import DeepTypeInference from '../deep-type-inference/deep-type-inference';
import TypeSimplifier from '../helpers/type-simplifier/type-simplifier';
import InterfaceHandler from "../interface-handler/interface-handler";

class ParameterTypeInference {
  static inferSetAccessorParameterTypes = (setter: SetAccessorDeclaration, project: Project, target: string) => {
    const initialTypes = setter.getParameters().map((p) => TypeHandler.getType(p).getText());
    findReferencesAsNodes(setter).forEach((ref) => {
      const parent = TypeInferenceValidator.validateSetAccessorParent(ref);
      const binary = TypeInferenceValidator.getBinaryAssignmentExpression(parent);
      binary && this.inferParameterTypes(setter.getParameters(), [binary.getRight()], project, target);
    });
    this.simplifyParameterTypes(setter.getParameters(), project, target);
    const parameters = setter.getParameters()
      .filter((p, i) => initialTypes[i] !== TypeHandler.getType(p).getText());
    DeepTypeInference.propagateParameterTypes(parameters);
  };

  static inferFunctionAssignmentParameterTypes = (
    assignment: PropertyAssignment | VariableDeclaration | PropertyDeclaration,
    project: Project,
    target: string
  ) => {
    const initializer = assignment.getInitializer();
    if (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer)) {
      const parameters = initializer.getParameters();
      const initialTypes = parameters.map((p) => TypeHandler.getType(p).getText());
      this.inferFunctionExpressionParameterTypes(assignment, parameters, project, target);
      this.simplifyParameterTypes(parameters, project, target);
      const filteredParameters = initializer.getParameters()
        .filter((p, i) => initialTypes[i] !== TypeHandler.getType(p).getText());
      DeepTypeInference.propagateParameterTypes(filteredParameters);
    }
  };

  static inferFunctionDeclarationParameterTypes = (
    declaration: FunctionDeclaration | MethodDeclaration,
    project: Project,
    target: string
  ) => {
    const initialTypes = declaration.getParameters().map((p) => TypeHandler.getType(p).getText());
    findReferencesAsNodes(declaration).forEach((ref) => {
      const parent = TypeInferenceValidator.validateCallExpressionParent(ref);
      const expression = TypeInferenceValidator.getCallExpression(parent);
      expression && this.inferParameterTypes(declaration.getParameters(), expression.getArguments(), project, target);
    });
    this.simplifyParameterTypes(declaration.getParameters(), project, target);
    const parameters = declaration.getParameters()
      .filter((p, i) => initialTypes[i] !== TypeHandler.getType(p).getText());
    DeepTypeInference.propagateParameterTypes(parameters);
  };

  static inferConstructorParameterTypes = (declaration: ConstructorDeclaration, project: Project, target: string) => {
    const initialTypes = declaration.getParameters().map((p) => TypeHandler.getType(p).getText());
    findReferencesAsNodes(declaration).forEach((ref) => {
      const parent = TypeInferenceValidator.getNewExpression(ref.getParent());
      parent && this.inferParameterTypes(declaration.getParameters(), parent.getArguments(), project, target);
    });
    this.simplifyParameterTypes(declaration.getParameters(), project, target);
    const parameters = declaration.getParameters()
      .filter((p, i) => initialTypes[i] !== TypeHandler.getType(p).getText());
    DeepTypeInference.propagateParameterTypes(parameters);
  };

  private static simplifyParameterTypes = (parameters: ParameterDeclaration[], project: Project, target: string) => {
    parameters.forEach((parameter) => {
      const simplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getTypeNode(parameter));
      simplified && TypeHandler.setTypeFiltered(parameter, simplified);
      InterfaceHandler.createInterfaceFromObjectLiterals(parameter, project, target);
    });
  };

  private static inferFunctionExpressionParameterTypes = (
    assignment: PropertyAssignment | VariableDeclaration | PropertyDeclaration,
    parameters: ParameterDeclaration[],
    project: Project,
    target: string
  ) => {
    findReferencesAsNodes(assignment).forEach((ref) => {
      const parent = TypeInferenceValidator.validateCallExpressionParent(ref);
      const expression = TypeInferenceValidator.getCallExpression(parent);
      expression && this.inferParameterTypes(parameters, expression.getArguments(), project, target);
    });
  };

  private static inferParameterTypes = (parameters: ParameterDeclaration[], _arguments: Node[], project: Project, target: string) => {
    parameters.forEach((parameter, i) => {
      if (i < _arguments.length && i + 1 <= parameters.length && parameter.isRestParameter()) {
        this.setRestParameterType(parameter, _arguments.slice(i), project, target);
      } else if (i < _arguments.length) {
        this.setParameterType(parameter, _arguments[i], project, target);
      } else if (!parameter.hasQuestionToken() && !parameter.isRestParameter()) {
        parameter.setHasQuestionToken(true);
      }
    });
  };

  private static setRestParameterType = (parameter: ParameterDeclaration, _arguments: Node[], project: Project, target: string) => {
    const parameterType = TypeHandler.getType(parameter);
    const argumentsType = _arguments.reduce((list: string[], node) => {
      const type = TypeHandler.getType(node);
      if (!list.includes(type.getText()) && !TypeChecker.isAnyOrUnknown(type)) {
        return list.concat(type.getText());
      }
      return list;
    }, []).map((t) => `(${t})`).join(' | ');

    const parameterText = parameterType.getText();
    if (argumentsType && (
      TypeChecker.isAnyOrUnknown(parameterType)
      || TypeChecker.isAnyOrUnknownArray(parameterType)
      || parameterText === 'never[]')
    ) {
      TypeHandler.setTypeFiltered(parameter, `(${argumentsType})[]`);
      InterfaceHandler.createInterfaceFromObjectLiterals(parameter, project, target);
    } else if (argumentsType) {
      TypeHandler.setTypeFiltered(parameter, `(${parameterType.getText()}) | (${argumentsType})[]`);
      InterfaceHandler.createInterfaceFromObjectLiterals(parameter, project, target);
    }
  };

  private static setParameterType = (parameter: ParameterDeclaration, argument: Node, project: Project, target: string) => {
    const type = TypeHandler.combineTypes(TypeHandler.getType(parameter), TypeHandler.getType(argument));
    TypeHandler.setTypeFiltered(parameter, type);
    InterfaceHandler.createInterfaceFromObjectLiterals(parameter, project, target);
  };
}

export default ParameterTypeInference;
