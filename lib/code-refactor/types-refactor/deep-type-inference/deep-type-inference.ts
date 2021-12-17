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
} from "ts-morph";
import {TypeHandler} from "../type-handler/type-handler";
import {DeclarationFinder} from "../../helpers/declaration-finder/declaration-finder";
import {FieldDeclarationKind, FunctionKind, isFieldDeclaration} from "../../helpers/combined-types/combined-types";
import {findReferencesAsNodes} from "../../helpers/reference-finder/reference-finder";
import {getExpressionParent, getInnerExpression} from "../../helpers/expression-handler/expression-handler";
import {TypeChecker} from "../helpers/type-checker/type-checker";
import {BindingNameHandler} from "../helpers/binding-name-handler/binding-name-handler";

type LeftExpression =
  FunctionExpression
  | ArrowFunction
  | Identifier
  | PropertyAccessExpression
  | ElementAccessExpression;

type FunctionTypes = ConstructorDeclaration | FunctionKind;

export class DeepTypeInference {
  static propagateClassOrInterfaceType = (declaration: FieldDeclarationKind) => {
    const type = TypeHandler.getType(declaration);
    if (isFieldDeclaration(declaration) && type.isClassOrInterface())
      this.checkDeclarationUsage(declaration);
  }

  static propagateParameterTypes = (parameters: ParameterDeclaration[]) => {
    parameters.forEach(parameter => {
      const nameNode = parameter.getNameNode();
      if (Node.isObjectBindingPattern(nameNode) || Node.isArrayBindingPattern(nameNode))
        BindingNameHandler.getIdentifiers(nameNode).forEach(identifier => {
          !TypeChecker.isAnyOrUnknown(identifier.getType()) && this.checkDeclarationUsage(identifier)
        })
      else if (!TypeChecker.isAnyOrUnknown(parameter.getType()))
        this.checkDeclarationUsage(parameter);
    });
  }

  private static checkDeclarationUsage = (declaration: ReferenceFindableNode & Node) => {
    findReferencesAsNodes(declaration).forEach(ref => {
      const innerExpression = getExpressionParent(ref);
      const parent = innerExpression?.getParent();
      if (this.isCallOrNewExpression(parent) && innerExpression && parent.getExpression().getPos() !== innerExpression.getPos()) {
        const _arguments = parent.getArguments();
        const index = _arguments.findIndex(node => node.getPos() === innerExpression.getPos());
        const expression = this.getLeftExpression(parent.getExpression());
        const argumentType = _arguments[index].getType();
        if (!TypeChecker.isAnyOrUnknown(argumentType))
          this.checkCallOrNewExpressionTarget(expression, index, argumentType);
      } else if (isFieldDeclaration(parent) && parent.getInitializer()?.getPos() === ref.getPos()) {
        this.checkDeclarationUsage(parent);
      }
    })
  }

  private static checkCallOrNewExpressionTarget = (expression: LeftExpression | undefined, index: number, type: Type) => {
    if (Node.isIdentifier(expression) || Node.isPropertyAccessExpression(expression)) {
      const declaration = DeclarationFinder.getClassOrFunction(expression);
      declaration && this.checkDeclaration(declaration, index, type);
    }
  }

  private static checkDeclaration = (declaration: Node, index: number, type: Type) => {
    if (Node.isClassDeclaration(declaration)
      || Node.isClassExpression(declaration))
      declaration.getConstructors().forEach(c => this.setParameterType(c, index, type));
    if (Node.isFunctionDeclaration(declaration)
      || Node.isMethodDeclaration(declaration)
      || Node.isFunctionExpression(declaration)
      || Node.isArrowFunction(declaration))
      this.setParameterType(declaration, index, type);
  }

  private static setParameterType = (_function: FunctionTypes, index: number, type: Type) => {
    const parameters = _function.getParameters();
    const lastParameter = parameters[parameters.length - 1];
    const lastType = lastParameter.getType().getArrayElementType()?.getText();
    if (index >= parameters.length && lastParameter.isRestParameter() && type.getText() !== lastType) {
      const parameter = TypeHandler.addArrayType(lastParameter, type.getText());
      Node.isParameterDeclaration(parameter) && this.checkDeclarationUsage(parameter);
    } else {
      parameters.forEach((p, i) => {
        if (i === index && type.getText() !== p.getType().getText()) {
          const parameter = TypeHandler.addType(p, type.getText());
          Node.isParameterDeclaration(parameter) && this.checkDeclarationUsage(parameter);
        }
      });
    }
  }

  private static isCallOrNewExpression = (node: Node | undefined): node is (CallExpression | NewExpression) => {
    return Node.isNewExpression(node) || Node.isCallExpression(node);
  }

  private static getLeftExpression = (expression: Expression): LeftExpression | undefined => {
    const innerExpression = getInnerExpression(expression);
    if (Node.isFunctionExpression(innerExpression)
      || Node.isArrowFunction(innerExpression)
      || Node.isIdentifier(innerExpression)
      || Node.isPropertyAccessExpression(innerExpression)
      || Node.isElementAccessExpression(innerExpression))
      return innerExpression;
    return undefined;
  }
}
