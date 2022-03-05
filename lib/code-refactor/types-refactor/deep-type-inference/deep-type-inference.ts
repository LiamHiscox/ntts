import {
  Node,
  Type,
  FunctionExpression,
  ArrowFunction,
  Identifier,
  PropertyAccessExpression,
  ElementAccessExpression,
  ParameterDeclaration,
  ConstructorDeclaration,
  CallExpression,
  NewExpression,
  Expression,
  ReferenceFindableNode
} from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';
import DeclarationFinder from '../../helpers/declaration-finder/declaration-finder';
import {FunctionKind, isFieldDeclaration} from '../../helpers/combined-types/combined-types';
import {findReferencesAsNodes} from '../../helpers/reference-finder/reference-finder';
import {getExpressionParent, getInnerExpression} from '../../helpers/expression-handler/expression-handler';
import TypeChecker from '../helpers/type-checker/type-checker';
import BindingNameHandler from '../helpers/binding-name-handler/binding-name-handler';
import TypeSimplifier from '../helpers/type-simplifier/type-simplifier';

type LeftExpression =
  FunctionExpression
  | ArrowFunction
  | Identifier
  | PropertyAccessExpression
  | ElementAccessExpression;

type FunctionTypes = ConstructorDeclaration | FunctionKind;

class DeepTypeInference {
  static propagateParameterTypes = (parameters: ParameterDeclaration[]) => {
    parameters.forEach((parameter) => {
      const nameNode = parameter.getNameNode();
      if (Node.isObjectBindingPattern(nameNode) || Node.isArrayBindingPattern(nameNode)) {
        BindingNameHandler.getIdentifiers(nameNode).forEach((identifier) => {
          !TypeChecker.isAnyOrUnknown(TypeHandler.getType(identifier)) && this.checkDeclarationUsage(identifier);
        });
      } else if (!TypeChecker.isAnyOrUnknown(TypeHandler.getType(parameter))) {
        this.checkDeclarationUsage(parameter);
      }
    });
  };

  private static checkDeclarationUsage = (declaration: ReferenceFindableNode & Node) => {
    findReferencesAsNodes(declaration).forEach((ref) => {
      const parent = ref.getParent();
      if (Node.isSpreadElement(parent)) {
        this.checkReferenceNode(parent);
      } else {
        this.checkReferenceNode(ref);
      }
    });
  };

  private static checkReferenceNode = (ref: Node) => {
    const innerExpression = getExpressionParent(ref);
    const parent = innerExpression?.getParent();
    if (this.isCallOrNewExpression(parent) && innerExpression && parent.getExpression().getPos() !== innerExpression.getPos()) {
      const _arguments = parent.getArguments();
      const index = _arguments.findIndex((node) => node.getPos() === innerExpression.getPos());
      const expression = this.getLeftExpression(parent.getExpression());
      const argumentType = TypeHandler.getType(_arguments[index]);
      if (!TypeChecker.isAnyOrUnknown(argumentType)) {
        this.checkCallOrNewExpressionTarget(expression, index, argumentType);
      }
    } else if (isFieldDeclaration(parent) && parent.getInitializer()?.getPos() === ref.getPos()) {
      this.checkDeclarationUsage(parent);
    }
  }

  private static checkCallOrNewExpressionTarget = (expression: LeftExpression | undefined, index: number, type: Type) => {
    if (Node.isIdentifier(expression) || Node.isPropertyAccessExpression(expression)) {
      const declaration = DeclarationFinder.getClassOrFunction(expression);
      declaration && this.checkDeclaration(declaration, index, type);
    }
  };

  private static checkDeclaration = (declaration: Node, index: number, type: Type) => {
    if (Node.isClassDeclaration(declaration)
      || Node.isClassExpression(declaration)) {
      declaration.getConstructors().forEach((c) => this.checkParameterType(c, index, type));
    }
    if (Node.isFunctionDeclaration(declaration)
      || Node.isMethodDeclaration(declaration)
      || Node.isFunctionExpression(declaration)
      || Node.isArrowFunction(declaration)) {
      this.checkParameterType(declaration, index, type);
    }
  };

  private static checkParameterType = (_function: FunctionTypes, index: number, type: Type) => {
    const parameters = _function.getParameters();
    const lastParameter = parameters[parameters.length - 1];
    if (index >= parameters.length && lastParameter.isRestParameter() && type.getText() !== TypeHandler.getType(lastParameter).getText()) {
      this.setRestParameterType(lastParameter, `(${type.getText()})[]`);
      return;
    }
    const parameter = parameters[index];
    const parameterTypeText = TypeHandler.getType(parameter).getText();
    if (parameter && parameter.isRestParameter() && type.getText() !== parameterTypeText) {
      this.setRestParameterType(parameter, `(${type.getText()})[]`);
      return;
    }
    if (parameter && type.getText() !== parameterTypeText) {
      const combined = TypeHandler.combineTypes(TypeHandler.getType(parameter), type);
      this.simplifyTypeNode(parameter, combined, parameterTypeText);
      return;
    }
  };

  private static setRestParameterType = (parameter: ParameterDeclaration, typeText: string) => {
    const initialTypeText = TypeHandler.getType(parameter).getText();
    const combined = TypeHandler.combineTypeWithList(TypeHandler.getType(parameter), typeText);
    this.simplifyTypeNode(parameter, combined, initialTypeText);
  }

  private static simplifyTypeNode = (parameter: ParameterDeclaration, combined: string, initialTypeText: string) => {
    const filteredParameter = TypeHandler.setTypeFiltered(parameter, combined);
    const simplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getTypeNode(filteredParameter));
    const newParameter = TypeHandler.setTypeFiltered(filteredParameter, simplified);
    const newTypeText = TypeHandler.getType(newParameter).getText();
    if (newTypeText !== initialTypeText && Node.isParameterDeclaration(newParameter)) {
      this.checkDeclarationUsage(newParameter);
    }
  }

  private static isCallOrNewExpression = (node: Node | undefined): node is (CallExpression | NewExpression) =>
    Node.isNewExpression(node) || Node.isCallExpression(node);

  private static getLeftExpression = (expression: Expression): LeftExpression | undefined => {
    const innerExpression = getInnerExpression(expression);
    if (Node.isFunctionExpression(innerExpression)
      || Node.isArrowFunction(innerExpression)
      || Node.isIdentifier(innerExpression)
      || Node.isPropertyAccessExpression(innerExpression)
      || Node.isElementAccessExpression(innerExpression)) {
      return innerExpression;
    }
    return undefined;
  };
}

export default DeepTypeInference;
