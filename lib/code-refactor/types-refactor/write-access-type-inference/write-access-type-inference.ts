import {
  BinaryExpression,
  Identifier,
  Node,
  PropertyDeclaration,
  ReferencedSymbol,
  SyntaxKind,
  TypedNode,
  VariableDeclaration,
  VariableDeclarationKind
} from "ts-morph";
import {findReferences} from "../../helpers/reference-finder/reference-finder";
import {TypeHandler} from "../type-handler/type-handler";
import {isWriteAccess} from "../../helpers/expression-handler/expression-handler";
import {ObjectLiteralHandler} from "../helpers/object-literal-handler/object-literal-handler";

export class WriteAccessTypeInference {
  static inferTypeByWriteAccess = (declaration: VariableDeclaration | PropertyDeclaration) => {
    const nameNode = declaration.getNameNode();
    const isConstant = this.isConstantDeclaration(declaration);
    if (!isConstant && !Node.isObjectBindingPattern(nameNode) && !Node.isArrayBindingPattern(nameNode)) {
      const newTypes = this.checkReferenceSymbols(declaration);
      const newDeclaration = TypeHandler.addTypes(declaration, ...newTypes);
      this.simplifyTypeNode(newDeclaration);
    } else {
      this.simplifyTypeNode(declaration);
    }
  }

  private static simplifyTypeNode = (declaration: TypedNode & Node) => {
    if (TypeHandler.getType(declaration).isUnion()) {
      const typeNode = declaration.getTypeNode();
      if (typeNode) {
        const simplified = ObjectLiteralHandler.simplifyTypeNode(typeNode);
        simplified && TypeHandler.setTypeFiltered(declaration, simplified);
      } else {
        const newTypeNode = TypeHandler.getTypeNode(declaration);
        const simplified = ObjectLiteralHandler.simplifyTypeNode(newTypeNode);
        if (simplified) {
          TypeHandler.setTypeFiltered(declaration, simplified);
          const simplifiedTypeNode = TypeHandler.getTypeNode(declaration);
          simplifiedTypeNode.getText() === newTypeNode.getText() && declaration.removeType();
        } else {
          declaration.removeType();
        }
      }
    }
  }

  private static checkReferenceSymbols = (declaration: VariableDeclaration | PropertyDeclaration | Identifier): string[] => {
    return findReferences(declaration).reduce((types, ref) => types.concat(...this.checkReferences(ref)), new Array<string>());
  }

  private static checkReferences = (referencedSymbol: ReferencedSymbol): string[] => {
    return referencedSymbol.getReferences().reduce((types, reference) => {
      const node = reference.getNode();
      const writeAccess = reference.isWriteAccess() || isWriteAccess(node);
      if (!reference.isDefinition() && writeAccess) {
        const newType = this.checkWriteAccess(node);
        return newType ? types.concat(newType) : types;
      }
      return types;
    }, new Array<string>())
  }

  private static isConstantDeclaration = (node: Node): boolean => {
    return Node.isVariableDeclaration(node) && node.getVariableStatement()?.getDeclarationKind() === VariableDeclarationKind.Const;
  }

  private static checkWriteAccess = (node: Node): string | undefined => {
    const writeAccess = this.getWriteAccessAncestor(node);
    if (writeAccess) {
      const type = writeAccess.getRight().getType().getBaseTypeOfLiteralType();
      return !type.isAny() ? type.getText() : undefined;
    }
    return;
  }

  private static getWriteAccessAncestor = (node: Node): BinaryExpression | undefined => {
    return node.getFirstAncestorByKind(SyntaxKind.BinaryExpression);
  }
}
