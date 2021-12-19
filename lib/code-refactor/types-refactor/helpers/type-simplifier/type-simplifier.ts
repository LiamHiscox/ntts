import {
  FunctionTypeNode,
  IndexSignatureDeclaration,
  InterfaceDeclaration,
  Node,
  SyntaxKind,
  TypeLiteralNode,
  TypeNode
} from "ts-morph";
import {TypeHandler} from "../../type-handler/type-handler";
import {PropertyHandler} from "./property-handler/property-handler";
import {IndexSignatureHandler} from "./index-signature-handler/index-signature-handler";

export class TypeSimplifier {
  static simplifyTypeNode = (typeNode: TypeNode): string | undefined => {
    const innerTypeNode = TypeHandler.getNonParenthesizedType(typeNode)
    if (Node.isUnionTypeNode(innerTypeNode)) {
      const typeNodes = innerTypeNode.getTypeNodes();
      return this.simplifyTypeNodeList(typeNodes);
    }
    if (Node.isTypeLiteral(innerTypeNode)) {
      innerTypeNode.getProperties().forEach(property => {
        const stringSimplified = this.simplifyTypeNode(TypeHandler.getTypeNode(property));
        stringSimplified && TypeHandler.setTypeFiltered(property, stringSimplified);
      });
    }
    return;
  }

  static simplifyTypeNodeList = (typeNodes: TypeNode[]): string => {
    const innerTypeNodes = typeNodes.map(t => TypeHandler.getNonParenthesizedType(t));
    const nonTypeLiterals = innerTypeNodes.filter(node => !Node.isTypeLiteral(node) && !Node.isFunctionTypeNode(node));
    const typeLiterals = innerTypeNodes.reduce((acc, cur) => Node.isTypeLiteral(cur) ? acc.concat(cur) : acc, new Array<TypeLiteralNode>());
    const functionTypes = innerTypeNodes.reduce((acc, cur) => Node.isFunctionTypeNode(cur) ? acc.concat(cur) : acc, new Array<FunctionTypeNode>());
    return this.combineTypeLists(typeLiterals, nonTypeLiterals, functionTypes);
  }

  private static combineTypeLists = (typeLiterals: TypeLiteralNode[], nonTypeLiterals: TypeNode[], functionTypes: FunctionTypeNode[]): string => {
    const combined1 = this.getCombinedFunctionTypes(functionTypes, nonTypeLiterals);
    const combined2 = this.getCombinedTypeLiteral(typeLiterals, combined1);
    return combined2.map(c => c.getText()).join(' | ');
  }

  private static getCombinedTypeLiteral = (typeLiterals: TypeLiteralNode[], nonTypeLiterals: TypeNode[]): TypeNode[] => {
    const [first, ...literals] = typeLiterals;
    if (first) {
      const combined = literals.reduce((combined, literal) => this.combineTypeLiterals(combined, literal), first);
      return nonTypeLiterals.concat(combined);
    }
    return nonTypeLiterals;
  }

  private static getCombinedFunctionTypes = (functionTypes: FunctionTypeNode[], nonTypeLiterals: TypeNode[]): TypeNode[] => {
    const [first, ...literals] = functionTypes;
    if (first) {
      const combined = literals.reduce((combined, literal) => this.combineFunctionTypes(combined, literal), first);
      const parenthesized = combined.replaceWithText(`(${combined.getText()})`).asKindOrThrow(SyntaxKind.ParenthesizedType);
      return nonTypeLiterals.concat(parenthesized);
    }
    return nonTypeLiterals;
  }

  static combineTypeLiterals = <T extends (TypeLiteralNode | InterfaceDeclaration)>(left: T, right: TypeLiteralNode): T => {
    PropertyHandler.updateProperties(left, right);
    this.updateIndexSignatures(left, right);
    return left;
  }

  static combineFunctionTypes = (left: FunctionTypeNode, right: FunctionTypeNode): FunctionTypeNode => {
    const rightParameters = right.getParameters();
    const leftParameters = left.getParameters();
    leftParameters.forEach((leftParameter, i) => {
      if (i < rightParameters.length) {
        const rightParameter = rightParameters[i];
        if (leftParameter.getName() === '_') {
          leftParameter.rename(rightParameter.getName());
        }
        const rightType = TypeHandler.getType(rightParameter);
        const leftType = TypeHandler.getType(leftParameter);
        if (rightType.getText() !== leftType.getText()) {
          const combined = TypeHandler.combineTypes(leftType, rightType);
          leftParameter.setHasQuestionToken(leftParameter.hasQuestionToken() || rightParameter.hasQuestionToken());
          leftParameter.setIsRestParameter(leftParameter.isRestParameter() || rightParameter.isRestParameter());
          const newParameter = TypeHandler.setTypeFiltered(leftParameter, combined);
          const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getTypeNode(newParameter));
          stringSimplified && TypeHandler.setTypeFiltered(newParameter, stringSimplified);
        }
      } else {
        leftParameter.setHasQuestionToken(true);
      }
    });
    for (let i = leftParameters.length; i < rightParameters.length; i++) {
      left.addParameter({
        hasQuestionToken: !rightParameters[i].isRestParameter(),
        initializer: rightParameters[i].getInitializer()?.getText(),
        isRestParameter: rightParameters[i].isRestParameter(),
        name: rightParameters[i].getName(),
        type: TypeHandler.getType(rightParameters[i]).getText()
      });
    }

    const rightReturnType = right.getReturnType();
    const leftReturnType = left.getReturnType();
    if (rightReturnType.getText() !== leftReturnType.getText()) {
      const combined = TypeHandler.combineTypes(leftReturnType, rightReturnType);
      const newFunction = TypeHandler.setReturnTypeFiltered(left, combined);
      const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getReturnTypeNode(newFunction));
      stringSimplified && TypeHandler.setReturnTypeFiltered(newFunction, stringSimplified);
    }

    return left;
  }

  static updateIndexSignatures = <T extends (TypeLiteralNode | InterfaceDeclaration)>(left: T, right: TypeLiteralNode) => {
    right.getIndexSignatures().forEach(member => {
      const signatures = left.getIndexSignatures();
      signatures.filter(s => s.getKeyType().getText() === "symbol");
      if (member.getKeyType().getText() === "symbol") {
        const combinedTypes = IndexSignatureHandler.getCombinedTypesOfSignatures(signatures, member, "symbol");
        this.addIndexSignatureByKey(signatures, member, left, combinedTypes, "symbol");
      } else {
        const combinedTypes = IndexSignatureHandler.getCombinedTypesOfSignatures(signatures, member, "number", "string");
        this.addIndexSignatureByKey(signatures, member, left, combinedTypes, "number");
        this.addIndexSignatureByKey(signatures, member, left, combinedTypes, "string");
      }
    });
  }

  static addIndexSignatureByKey = (signatures: IndexSignatureDeclaration[],
                                   member: IndexSignatureDeclaration,
                                   left: TypeLiteralNode | InterfaceDeclaration,
                                   combinedTypes: string | undefined,
                                   ...keyTypes: string[]
  ) => {
    const stringSignature = signatures.find(s => keyTypes.includes(s.getKeyType().getText()));
    const stringIndexSignature = IndexSignatureHandler.addIndexSignature(member, stringSignature, left, combinedTypes);
    const stringSimplified = this.simplifyTypeNode(TypeHandler.getReturnTypeNode(stringIndexSignature));
    stringSimplified && TypeHandler.setReturnTypeFiltered(stringIndexSignature, stringSimplified);
  }
}
