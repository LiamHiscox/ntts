import {Node, PropertyDeclaration, PropertySignature, TypeNode, VariableDeclaration} from "ts-morph";
import {TypeHandler} from "../type-handler/type-handler";
import {ReferenceChecker} from "./reference-checker/reference-checker";
import {TypeSimplifier} from "../helpers/type-simplifier/type-simplifier";
import {ArrayTypeHandler} from "../helpers/array-type-handler/array-type-handler";
import {BindingNameHandler} from "../helpers/binding-name-handler/binding-name-handler";
import {TypeChecker} from "../helpers/type-checker/type-checker";


export class UsageTypeInference {
  static inferDeclarationType = (declaration: VariableDeclaration | PropertyDeclaration) => {
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

  private static getNameNode = (declaration: VariableDeclaration | PropertyDeclaration) => {
    if (Node.isVariableDeclaration(declaration))
      return declaration.getNameNode();
    else
      return declaration;
  }

  private static handleArray = (declaration: VariableDeclaration | PropertyDeclaration) => {
    const nameNode = this.getNameNode(declaration);
    if ((Node.isArrayBindingPattern(nameNode) || Node.isObjectBindingPattern(nameNode)) && BindingNameHandler.hasRestVariable(nameNode)) {
      const currentType = TypeHandler.getType(declaration);
      this.setNewTypeAndCheckReferences(declaration, currentType.getText());
    } else if (Node.isArrayBindingPattern(nameNode) || Node.isObjectBindingPattern(nameNode)) {
      const newType = ReferenceChecker.checkIdentifiers(nameNode);
      const currentType = TypeHandler.getType(declaration);
      if (newType) {
        const combinedTypes = TypeChecker.isAny(currentType) ? newType : `${currentType.getText()} | ${newType}`;
        this.setNewTypeAndCheckArrayReferences(declaration, combinedTypes);
      } else {
        const combinedTypes = TypeChecker.isAny(currentType) ? newType : currentType.getText();
        this.setNewTypeAndCheckArrayReferences(declaration, combinedTypes);
      }
    } else {
      const newType = ReferenceChecker.checkIdentifierReferences(nameNode);
      this.setNewTypeAndCheckArrayReferences(declaration, newType);
    }
  }

  private static handleType = (declaration: VariableDeclaration | PropertyDeclaration) => {
    const nameNode = this.getNameNode(declaration);
    if ((Node.isArrayBindingPattern(nameNode) || Node.isObjectBindingPattern(nameNode)) && BindingNameHandler.hasRestVariable(nameNode)) {
      const currentType = TypeHandler.getType(declaration);
      this.setNewTypeAndCheckReferences(declaration, currentType.getText());
    } else if (Node.isArrayBindingPattern(nameNode) || Node.isObjectBindingPattern(nameNode)) {
      const newType = ReferenceChecker.checkIdentifiers(nameNode);
      const currentType = TypeHandler.getType(declaration);
      if (newType) {
        this.setNewTypeAndCheckReferences(declaration, newType);
      } else {
        this.setNewTypeAndCheckReferences(declaration, currentType.getText());
      }
    } else {
      const newType = ReferenceChecker.checkIdentifierReferences(nameNode);
      this.setNewTypeAndCheckReferences(declaration, newType);
    }
  }

  private static setNewTypeAndCheckArrayReferences = (declaration: VariableDeclaration | PropertySignature | PropertyDeclaration, newType: string | undefined) => {
    newType && TypeHandler.setTypeFiltered(declaration, newType);
    const typeNode = declaration.getTypeNode();
    if (newType && typeNode) {
      const simplified = ArrayTypeHandler.combineArrayTypes(typeNode);
      simplified && TypeHandler.setTypeFiltered(declaration, simplified);
    }
    const newTypeNode = declaration.getTypeNode();
    newTypeNode && this.checkTypeNodeReferences(newTypeNode);
  }

  private static setNewTypeAndCheckReferences = (declaration: VariableDeclaration | PropertySignature | PropertyDeclaration, newType: string | undefined) => {
    newType && TypeHandler.setTypeFiltered(declaration, newType);
    const typeNode = declaration.getTypeNode();
    if (newType && typeNode) {
      const simplified = TypeSimplifier.simplifyTypeNode(typeNode);
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
