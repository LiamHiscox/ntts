import {
  IndexSignatureDeclaration,
  Node,
  PropertySignature,
  SyntaxKind,
  Type,
  TypeLiteralNode,
  TypeNode
} from "ts-morph";
import {TypeHandler} from "../../type-handler/type-handler";
import {TypeChecker} from "../type-checker/type-checker";

export class ObjectLiteralHandler {
  static simplifyTypeNode = (typeNode: TypeNode): string | undefined => {
    if (Node.isUnionTypeNode(typeNode)) {
      const typeNodes = typeNode.getTypeNodes();
      const nonTypeLiterals = typeNodes.filter(node => !Node.isTypeLiteral(node));
      const typeLiterals = typeNodes.reduce((acc, cur) => Node.isTypeLiteral(cur) ? acc.concat(cur) : acc, new Array<TypeLiteralNode>());
      return this.combineTypeList(typeLiterals, nonTypeLiterals);
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

  private static combineTypeLiterals = (left: TypeLiteralNode, right: TypeLiteralNode): TypeLiteralNode => {
    right.getProperties().forEach(member => {
      const property = left.getProperty(member.getName());
      const newProperty = this.addProperty(member, property, left);
      const simplified = this.simplifyTypeNode(TypeHandler.getTypeNode(newProperty));
      simplified && TypeHandler.setTypeFiltered(newProperty, simplified);
    });

    right.getIndexSignatures().forEach(member => {
      const signatures = left.getIndexSignatures();
      signatures.filter(s => s.getKeyType().getText() === "symbol");
      if (member.getKeyType().getText() === "symbol") {
        const combinedTypes = this.getCombinedTypesOfSignatures(signatures, member, "symbol");
        this.addIndexSignatureByKey(signatures, member, left, combinedTypes, "symbol");
      } else {
        const combinedTypes = this.getCombinedTypesOfSignatures(signatures, member, "number", "string");
        this.addIndexSignatureByKey(signatures, member, left, combinedTypes, "number");
        this.addIndexSignatureByKey(signatures, member, left, combinedTypes, "string");
      }
    });
    return left;
  }

  private static getCombinedTypesOfSignatures = (signatures: IndexSignatureDeclaration[], member: IndexSignatureDeclaration, ...keyTypes: string[]): string | undefined => {
    const newTypes = signatures.filter(s => keyTypes.includes(s.getKeyType().getText())).map(s => s.getReturnType()).filter(s => !s.isAny()).map(s => s.getText());
    return TypeHandler.combineTypeWithList(member.getReturnType(), ...newTypes);
  }

  private static addIndexSignatureByKey = (signatures: IndexSignatureDeclaration[], member: IndexSignatureDeclaration, left: TypeLiteralNode, combinedTypes: string | undefined, ...keyTypes: string[]) => {
    const stringSignature = signatures.find(s => keyTypes.includes(s.getKeyType().getText()));
    const stringIndexSignature = this.addIndexSignature(member, stringSignature, left, combinedTypes);
    const stringSimplified = this.simplifyTypeNode(TypeHandler.getReturnTypeNode(stringIndexSignature));
    stringSimplified && TypeHandler.setReturnTypeFiltered(stringIndexSignature, stringSimplified);
  }

  private static addProperty = (member: PropertySignature, property: PropertySignature | undefined, left: TypeLiteralNode): PropertySignature => {
    if (!property) {
      return left.addProperty({
        name: member.getName(),
        type: TypeHandler.getType(member).getText()
      });
    } else if (property.getType().getText() !== member.getType().getText()) {
      const combined = this.combineTypes(property.getType(), member.getType());
      return TypeHandler.setTypeFiltered(property, combined).asKindOrThrow(SyntaxKind.PropertySignature);
    }
    return property;
  }

  private static addIndexSignature = (member: IndexSignatureDeclaration, leftIndex: IndexSignatureDeclaration | undefined, left: TypeLiteralNode, combinedTypes: string | undefined): IndexSignatureDeclaration => {
    if (!leftIndex) {
      return left.addIndexSignature({
        keyName: member.getKeyName(),
        keyType: member.getKeyType().getText(),
        returnType: combinedTypes || member.getReturnType().getText()
      });
    } else if (leftIndex.getReturnType().getText() !== member.getReturnType().getText()) {
      const newReturn = leftIndex.setReturnType(combinedTypes || leftIndex.getReturnType().getText()).getReturnType();
      return leftIndex.setReturnType(newReturn.getText());
    }
    return leftIndex;
  }

  private static combineTypes = (left: Type, right: Type): string => {
    if (TypeChecker.isAny(right))
      return left.getText();
    if (TypeChecker.isAny(left))
      return right.getText();
    return `${left.getText()} | ${right.getText()}`;
  }
}
