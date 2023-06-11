import { FunctionTypeNode, IndexSignatureDeclaration, Node, SyntaxKind, TypeLiteralNode, TypeNode } from 'ts-morph';
import TypeHandler from '../../type-handler/type-handler.js';
import PropertyHandler from './property-handler/property-handler.js';
import IndexSignatureHandler from './index-signature-handler/index-signature-handler.js';
import { TypeMemberKind } from '../../../helpers/combined-types/combined-types.js';

class TypeSimplifier {
  static simplifyTypeNode = (typeNode: TypeNode): string => {
    const innerTypeNode = TypeHandler.getNonParenthesizedTypeNode(typeNode);
    if (Node.isUnionTypeNode(innerTypeNode)) {
      const typeNodes = innerTypeNode.getTypeNodes();
      return this.simplifyTypeNodeList(typeNodes);
    }
    this.simplifyUnionType(typeNode);
    return typeNode.getText();
  };

  private static simplifyUnionType = (typeNode: TypeNode) => {
    typeNode.getDescendantsOfKind(SyntaxKind.UnionType).forEach(union => {
      if (!union.wasForgotten()) {
        this.simplifyTypeNodeList(union.getTypeNodes());
        this.simplifyUnionType(union);
      }
    })
  }

  static simplifyTypeNodeList = (typeNodes: TypeNode[]): string => {
    const innerTypeNodes = typeNodes.map((t) => TypeHandler.getNonParenthesizedTypeNode(t));
    const nonFunctionTypes = this.getNonFunctionTypes(innerTypeNodes);
    const functionTypes = this.getFunctionTypes(innerTypeNodes);
    return this.combineTypeLists(nonFunctionTypes, functionTypes);
  };

  private static getNonFunctionTypes = (innerTypeNodes: TypeNode[]) => innerTypeNodes
    .filter((node) => !Node.isFunctionTypeNode(node));

  private static getFunctionTypes = (innerTypeNodes: TypeNode[]) => innerTypeNodes
    .reduce((acc: FunctionTypeNode[], cur) => (Node.isFunctionTypeNode(cur) ? acc.concat(cur) : acc), []);

  private static combineTypeLists = (nonFunctionTypes: TypeNode[], functionTypes: FunctionTypeNode[]): string => {
    return this
      .getCombinedFunctionTypes(functionTypes, nonFunctionTypes)
      .map((c) => c.getText())
      .join(' | ');
  };

  private static getCombinedFunctionTypes = (functionTypes: FunctionTypeNode[], nonTypeLiterals: TypeNode[]): TypeNode[] => {
    const [first, ...literals] = functionTypes;
    if (first) {
      const combined = literals.reduce((c, literal) => this.combineFunctionTypes(c, literal), first);
      const parenthesized = combined
        .replaceWithText(`(${combined.getText()})`)
        .asKindOrThrow(SyntaxKind.ParenthesizedType);
      return nonTypeLiterals.concat(parenthesized);
    }
    return nonTypeLiterals;
  };

  static combineTypeLiterals = <T extends TypeMemberKind>(left: T, right: TypeLiteralNode): T => {
    PropertyHandler.updateProperties(left, right);
    this.updateIndexSignatures(left, right);
    return left;
  };

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
          TypeHandler.setTypeFiltered(newParameter, stringSimplified);
        }
      }
    });
    for (let i = leftParameters.length; i < rightParameters.length; i += 1) {
      left.addParameter({
        hasQuestionToken: rightParameters[i].hasQuestionToken(),
        initializer: rightParameters[i].getInitializer()?.getText(),
        isRestParameter: rightParameters[i].isRestParameter(),
        name: rightParameters[i].getName(),
        type: TypeHandler.getType(rightParameters[i]).getText(),
      });
    }

    const rightReturnType = right.getReturnType();
    const leftReturnType = left.getReturnType();
    if (rightReturnType.getText() !== leftReturnType.getText()) {
      const combined = TypeHandler.combineTypes(leftReturnType, rightReturnType);
      const newFunction = TypeHandler.setReturnTypeFiltered(left, combined);
      const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getReturnTypeNode(newFunction));
      TypeHandler.setReturnTypeFiltered(newFunction, stringSimplified);
    }

    return left;
  };

  static updateIndexSignatures = <T extends TypeMemberKind>(left: T, right: TypeLiteralNode) => {
    right.getIndexSignatures().forEach((member) => {
      const signatures = left.getIndexSignatures();
      signatures.filter((s) => s.getKeyType().getText() === 'symbol');
      if (member.getKeyType().getText() === 'symbol') {
        const combinedTypes = IndexSignatureHandler.getCombinedTypesOfSignatures(signatures, member, 'symbol');
        this.addIndexSignatureByKey(signatures, member, left, combinedTypes, 'symbol');
      } else {
        const combinedTypes = IndexSignatureHandler.getCombinedTypesOfSignatures(signatures, member, 'number', 'string');
        this.addIndexSignatureByKey(signatures, member, left, combinedTypes, 'number');
        this.addIndexSignatureByKey(signatures, member, left, combinedTypes, 'string');
      }
    });
  };

  static addIndexSignatureByKey = (
    signatures: IndexSignatureDeclaration[],
    member: IndexSignatureDeclaration,
    left: TypeMemberKind,
    combinedTypes: string | undefined,
    ...keyTypes: string[]
  ) => {
    const stringSignature = signatures.find((s) => keyTypes.includes(s.getKeyType().getText()));
    const stringIndexSignature = IndexSignatureHandler.addIndexSignature(member, stringSignature, left, combinedTypes);
    const stringSimplified = this.simplifyTypeNode(TypeHandler.getReturnTypeNode(stringIndexSignature));
    stringSimplified && TypeHandler.setReturnTypeFiltered(stringIndexSignature, stringSimplified);
  };
}

export default TypeSimplifier;
