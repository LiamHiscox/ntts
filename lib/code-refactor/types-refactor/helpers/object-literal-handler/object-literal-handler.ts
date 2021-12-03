import {Node, Type, TypeLiteralNode, TypeNode} from "ts-morph";
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
      const combined = literals.reduce((combined, literal) => this.combineTypeLiteral(combined, literal), first);
      return nonTypeLiterals.concat(combined).map(c => c.getText()).join(' | ');
    }
    return nonTypeLiterals.concat(...typeLiterals).map(c => c.getText()).join(' | ');
  }

  static combineTypeLiteral = (left: TypeLiteralNode, right: TypeLiteralNode): TypeLiteralNode => {
    right.getMembers().forEach((member) => {
      if (Node.isPropertySignature(member)) {
        const property = left.getProperty(member.getName());
        if (!property) {
          left.addProperty({
            name: member.getName(),
            type: TypeHandler.getType(member).getText()
          });
        } else if (property.getType().getText() !== member.getType().getText()) {
          const combined = this.combineTypes(property.getType(), member.getType());
          TypeHandler.setTypeFiltered(property, combined);
        }
      }
      if (Node.isIndexSignatureDeclaration(member)) {
        const leftIndex = left.getIndexSignatures().find(index => index.getKeyType().getText() === member.getKeyType().getText());
        if (!leftIndex) {
          left.addIndexSignature({
            keyName: member.getKeyName(),
            keyType: member.getKeyType().getText(),
            returnType: member.getReturnType().getText()
          });
        } else if (leftIndex.getReturnType().getText() !== member.getReturnType().getText()) {
          const combined = this.combineTypes(leftIndex.getReturnType(), member.getReturnType());
          const newReturn = leftIndex.setReturnType(combined).getReturnType();
          leftIndex.setReturnType(newReturn.getText());
        }
      }
    })
    return left;
  }

  private static combineTypes = (left: Type, right: Type): string => {
    if (TypeChecker.isAny(right))
      return left.getText();
    if (TypeChecker.isAny(left))
      return right.getText();
    return `${left.getText()} | ${right.getText()}`;
  }
}
