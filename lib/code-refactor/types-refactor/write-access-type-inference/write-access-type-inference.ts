import {
  BinaryExpression,
  Node,
  Project,
  PropertyAssignment,
  PropertyDeclaration,
  PropertySignature,
  ReferencedSymbol,
  ReferenceFindableNode,
  SyntaxKind,
  TypedNode,
  VariableDeclaration,
  VariableDeclarationKind,
} from 'ts-morph';
import { findReferences } from '../../helpers/reference-finder/reference-finder';
import TypeHandler from '../type-handler/type-handler';
import { isWriteAccess } from '../../helpers/expression-handler/expression-handler';
import TypeSimplifier from '../helpers/type-simplifier/type-simplifier';
import InterfaceHandler from '../interface-handler/interface-handler';
import TypeChecker from '../helpers/type-checker/type-checker';

class WriteAccessTypeInference {
  static inferTypeByWriteAccess = (declaration: VariableDeclaration | PropertyDeclaration | PropertySignature, project: Project, target: string) => {
    const nameNode = declaration.getNameNode();
    const isConstant = this.isConstantDeclaration(declaration);
    if (!isConstant && !Node.isObjectBindingPattern(nameNode) && !Node.isArrayBindingPattern(nameNode)) {
      const initialType = TypeHandler.getType(declaration).getText();
      const newTypes = this.checkReferenceSymbols(declaration);
      const combined = TypeHandler.combineTypeWithList(TypeHandler.getType(declaration), ...newTypes);
      const newDeclaration = TypeHandler.setTypeFiltered(declaration, combined);
      this.simplifyTypeNode(newDeclaration);
      const newType = TypeHandler.getType(newDeclaration).getText();
      if (TypeChecker.isNullOrUndefined(TypeHandler.getType(newDeclaration)) || initialType === newType) {
        newDeclaration.removeType();
      } else {
        InterfaceHandler.createInterfaceFromObjectLiterals(newDeclaration, project, target);
      }
    }
  };

  static checkNodeWriteAccess = (node: Node): string | undefined => {
    if (isWriteAccess(node)) {
      return this.checkWriteAccess(node);
    }
    return undefined;
  }

  private static simplifyTypeNode = (declaration: TypedNode & Node) => {
    const typeNode = declaration.getTypeNode();
    if (typeNode) {
      const simplified = TypeSimplifier.simplifyTypeNode(typeNode);
      TypeHandler.setTypeFiltered(declaration, simplified);
    } else {
      const newTypeNode = TypeHandler.getTypeNode(declaration);
      const newTypeNodeText = newTypeNode.getText();
      const simplified = TypeSimplifier.simplifyTypeNode(newTypeNode);
      if (simplified !== newTypeNode.getText()) {
        TypeHandler.setTypeFiltered(declaration, simplified);
        const simplifiedTypeNode = TypeHandler.getTypeNode(declaration);
        simplifiedTypeNode.getText() === newTypeNodeText && declaration.removeType();
      } else {
        declaration.removeType();
      }
    }
  };

  private static checkReferenceSymbols = (declaration: ReferenceFindableNode & Node): string[] => findReferences(declaration)
    .reduce((types: string[], ref) => types.concat(...this.checkReferences(ref)), []);

  private static checkReferences = (referencedSymbol: ReferencedSymbol): string[] => referencedSymbol
    .getReferences()
    .reduce((types: string[], reference) => {
      const node = reference.getNode();
      const writeAccess = reference.isWriteAccess() || isWriteAccess(node);
      if (!reference.isDefinition() && writeAccess) {
        const newType = this.checkWriteAccess(node);
        return newType ? types.concat(newType) : types;
      }
      return types;
    }, []);

  private static isConstantDeclaration = (node: Node): boolean => Node.isVariableDeclaration(node)
    && node.getVariableStatement()?.getDeclarationKind() === VariableDeclarationKind.Const;

  private static checkWriteAccess = (node: Node): string | undefined => {
    const writeAccess = this.getWriteAccessAncestor(node);
    if (Node.isBinaryExpression(writeAccess)) {
      const type = TypeHandler.getType(writeAccess.getRight());
      return !TypeChecker.isAnyOrUnknown(type) ? type.getText() : undefined;
    }
    if (Node.isPropertyAssignment(writeAccess)) {
      const initializer = writeAccess.getInitializer();
      const type = initializer && TypeHandler.getType(initializer);
      return type && !TypeChecker.isAnyOrUnknown(type) ? type.getText() : undefined;
    }
    return undefined;
  };

  private static getWriteAccessAncestor = (node: Node): BinaryExpression | PropertyAssignment | undefined => {
    const result = node.getAncestors().find((a) => Node.isBinaryExpression(a) || Node.isPropertyAssignment(a));
    return result?.asKind(SyntaxKind.BinaryExpression) || result?.asKind(SyntaxKind.PropertyAssignment);
  };
}

export default WriteAccessTypeInference;
