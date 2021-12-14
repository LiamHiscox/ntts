import {
  IndexSignatureDeclaration,
  InterfaceDeclaration,
  Node,
  TypeLiteralNode,
  TypeNode
} from "ts-morph";
import {TypeHandler} from "../../type-handler/type-handler";
import {PropertyHandler} from "./property-handler/property-handler";
import {IndexSignatureHandler} from "./index-signature-handler/index-signature-handler";

export class ObjectLiteralHandler {
  static simplifyTypeNode = (typeNode: TypeNode): string | undefined => {
    if (Node.isUnionTypeNode(typeNode)) {
      const typeNodes = typeNode.getTypeNodes();
      const nonTypeLiterals = typeNodes.filter(node => !Node.isTypeLiteral(node));
      const typeLiterals = typeNodes.reduce((acc, cur) => Node.isTypeLiteral(cur) ? acc.concat(cur) : acc, new Array<TypeLiteralNode>());
      return this.combineTypeList(typeLiterals, nonTypeLiterals);
    }
    if (Node.isTypeLiteral(typeNode)) {
      typeNode.getProperties().forEach(property => {
        const stringSimplified = this.simplifyTypeNode(TypeHandler.getTypeNode(property));
        stringSimplified && TypeHandler.setTypeFiltered(property, stringSimplified);
      });
    }
    return;
  }

  static simplifyTypeNodeList = (typeNodes: TypeNode[]): string => {
    const nonTypeLiterals = typeNodes.filter(node => !Node.isTypeLiteral(node));
    const typeLiterals = typeNodes.reduce((acc, cur) => Node.isTypeLiteral(cur) ? acc.concat(cur) : acc, new Array<TypeLiteralNode>());
    return this.combineTypeList(typeLiterals, nonTypeLiterals);
  }

  private static combineTypeList = (typeLiterals: TypeLiteralNode[], nonTypeLiterals: TypeNode[]): string => {
    if (typeLiterals.length >= 2) {
      const [first, ...literals] = typeLiterals;
      const combined = literals.reduce((combined, literal) => this.combineTypeLiterals(combined, literal), first);
      return nonTypeLiterals.concat(combined).map(c => c.getText()).join(' | ');
    }
    return nonTypeLiterals.concat(...typeLiterals).map(c => c.getText()).join(' | ');
  }

  static combineTypeLiterals = <T extends (TypeLiteralNode | InterfaceDeclaration)>(left: T, right: TypeLiteralNode): T => {
    PropertyHandler.updateProperties(left, right);
    this.updateIndexSignatures(left, right);
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
