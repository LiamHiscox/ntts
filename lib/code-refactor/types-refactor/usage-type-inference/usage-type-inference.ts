import {Node, PropertySignature, TypeNode, VariableDeclaration} from "ts-morph";
import {TypeHandler} from "../type-handler/type-handler";
import {ReferenceChecker} from "./reference-checker/reference-checker";
import {ObjectLiteralHandler} from "../helpers/object-literal-handler/object-literal-handler";
import {ArrayTypeHandler} from "../helpers/array-type-handler/array-type-handler";
import {BindingNameHandler} from "../helpers/binding-name-handler/binding-name-handler";
import {TypeChecker} from "../helpers/type-checker/type-checker";


export class UsageTypeInference {
  // PropertyDeclaration
  static inferDeclarationType = (declaration: VariableDeclaration) => {
    const initializer = declaration.getInitializer();
    if (Node.isFunctionExpression(initializer)
      || Node.isArrowFunction(initializer)
      || Node.isClassExpression(initializer)
    ) {
      return;
    }

    const initialType = declaration.getInitializer()?.getType();
    if (initialType?.isArray()) {
      this.handleArray(declaration);
    } else {
      this.handleType(declaration);
    }
  }

  private static handleArray = (declaration: VariableDeclaration) => {
    const nameNode = declaration.getNameNode();
    if (Node.isIdentifier(nameNode)) {
      const newType = ReferenceChecker.checkIdentifierReferences(nameNode);
      this.setNewTypeAndCheckArrayReferences(declaration, newType);
    } else if (BindingNameHandler.hasRestVariable(nameNode)) {
      const currentType = TypeHandler.getType(declaration);
      this.setNewTypeAndCheckReferences(declaration, currentType.getText());
    } else {
      const newType = ReferenceChecker.checkIdentifiers(declaration.getNameNode());
      const currentType = TypeHandler.getType(declaration);
      if (newType) {
        const combinedTypes = TypeChecker.isAny(currentType) ? newType : `${currentType.getText()} | ${newType}`;
        this.setNewTypeAndCheckArrayReferences(declaration, combinedTypes);
      } else {
        const combinedTypes = TypeChecker.isAny(currentType) ? newType : currentType.getText();
        this.setNewTypeAndCheckArrayReferences(declaration, combinedTypes);
      }
    }
  }

  private static handleType = (declaration: VariableDeclaration) => {
    const nameNode = declaration.getNameNode();
    if (Node.isIdentifier(nameNode)) {
      const newType = ReferenceChecker.checkIdentifierReferences(nameNode);
      this.setNewTypeAndCheckReferences(declaration, newType);
    } else if (BindingNameHandler.hasRestVariable(nameNode)) {
      const currentType = TypeHandler.getType(declaration);
      this.setNewTypeAndCheckReferences(declaration, currentType.getText());
    } else {
      const newType = ReferenceChecker.checkIdentifiers(declaration.getNameNode());
      const currentType = TypeHandler.getType(declaration);
      if (newType) {
        this.setNewTypeAndCheckReferences(declaration, newType);
      } else {
        this.setNewTypeAndCheckReferences(declaration, currentType.getText());
      }
    }
  }

  private static setNewTypeAndCheckArrayReferences = (declaration: VariableDeclaration | PropertySignature, newType: string | undefined) => {
    newType && TypeHandler.setTypeFiltered(declaration, newType);
    const typeNode = declaration.getTypeNode();
    if (newType && typeNode) {
      const simplified = ArrayTypeHandler.combineArrayTypes(typeNode);
      simplified && TypeHandler.setTypeFiltered(declaration, simplified);
    }
    const newTypeNode = declaration.getTypeNode();
    newTypeNode && this.checkTypeNodeReferences(newTypeNode);
  }

  private static setNewTypeAndCheckReferences = (declaration: VariableDeclaration | PropertySignature, newType: string | undefined) => {
    newType && TypeHandler.setTypeFiltered(declaration, newType);
    const typeNode = declaration.getTypeNode();
    if (newType && typeNode) {
      const simplified = ObjectLiteralHandler.simplifyTypeNode(typeNode);
      simplified && TypeHandler.setTypeFiltered(declaration, simplified);
    }
    const newTypeNode = declaration.getTypeNode();
    newTypeNode && this.checkTypeNodeReferences(newTypeNode);
  }

  private static checkTypeNodeReferences = (typeNode: TypeNode) => {
    if (Node.isTypeLiteral(typeNode)) {
      typeNode.getProperties().forEach(property => {
        const newType = ReferenceChecker.checkIdentifierReferences(property);
        this.setNewTypeAndCheckReferences(property, newType);
      });
    }
    if (Node.isUnionTypeNode(typeNode)) {
      typeNode.getTypeNodes().forEach(node => {
        this.checkTypeNodeReferences(node);
      })
    }
    if (Node.isArrayTypeNode(typeNode)) {
      const node = typeNode.getElementTypeNode()
      this.checkTypeNodeReferences(node);
    }
    if (Node.isTupleTypeNode(typeNode)) {
      typeNode.getElements().forEach(node => {
        this.checkTypeNodeReferences(node);
      })
    }
  }
}
