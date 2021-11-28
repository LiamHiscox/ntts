import {BindingName, Identifier, Node, ReferencedSymbol, SyntaxKind, Type, VariableDeclaration} from "ts-morph";
import {TypeHandler} from "../type-handler/type-handler";

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

    const nameNode = declaration.getNameNode();
    if (Node.isIdentifier(nameNode)) {
      const newType = this.checkIdentifierReferences(nameNode);
      newType && TypeHandler.setSimpleType(declaration, newType);
    } else {
      /*
      * this possibly doesn't make sense anyway
      * as a object destructuring has to be initialized anyway
      *
      * this is still valid
      * could collect all the possible types and construct a TypeLiteral from that
      * if all the types equal their initial type or are any then there is not need to set the type
      * const fun = (): {a: number, b: string, c: boolean} => ({ a: 12, b: "qwe", c: true });
      * let {a, b}: { a: number; b: string; } = fun();
      * */
      const typeNode = declaration.getTypeNode();
      const type = this.getIdentifiers(declaration.getNameNode());
      if (!typeNode || typeNode.getText() !== type) {
        TypeHandler.setSimpleType(declaration, type);
      }
    }
  }

  static getIdentifiers = (bindingName: BindingName): string => {
    if (Node.isIdentifier(bindingName)) {
      return this.checkIdentifierReferences(bindingName) || bindingName.getType().getText();
    }
    if (Node.isArrayBindingPattern(bindingName)) {
      const newTypes = bindingName.getElements().map(element => {
        if (Node.isOmittedExpression(element)) {
          return element.getType().getText();
        }
        return this.getIdentifiers(element.getNameNode());
      })
      return `[${newTypes.join(', ')}]`;
    }
    const newTypes = bindingName.getElements().map(element => {
      const propertyName = element.getPropertyNameNode()?.getText() || element.getName();
      const newType = this.getIdentifiers(element.getNameNode());
      return `${propertyName}: ${newType};`;
    })
    return `{ ${newTypes.join(' ')} }`;
  }

  private static checkIdentifierReferences = (identifier: Identifier): string | undefined => {
    const initialType = TypeHandler.getType(identifier);
    const newTypes = identifier.findReferences().reduce((types, ref) =>
      types.concat(...this.checkReferenceEntries(ref, initialType)), new Array<Type>());

    const uniqueTypes = newTypes.reduce((acc, cur) =>
      cur.isAny() || acc.includes(cur.getText()) ? acc : acc.concat(cur.getText()), new Array<string>());
    if (uniqueTypes.length > 0)
      return initialType.isAny() ? uniqueTypes.join(' | ') : `${initialType.getText()} | ${uniqueTypes.join(' | ')}`;
    return;
  }

  private static checkReferenceEntries = (symbol: ReferencedSymbol, initialType: Type) => {
    return symbol.getReferences().reduce((types, entry) => {
      if (!entry.isDefinition() && entry.isWriteAccess()) {
        const type = this.getWriteAccessType(entry.getNode(), initialType);
        return type ? types.concat(type) : types;
      }
      return types;
    }, new Array<Type>());
  }

  private static getWriteAccessType = (node: Node, initialType: Type): Type | undefined => {
    const binary = node.getFirstAncestorByKind(SyntaxKind.BinaryExpression);
    if (binary && binary.getOperatorToken().asKind(SyntaxKind.EqualsToken) && binary.getLeft()) {
      const assignedType = TypeHandler.getType(binary.getRight()).getBaseTypeOfLiteralType();
      return !assignedType.isAny() && assignedType.getText() !== initialType.getText() ? assignedType : undefined;
    }
    return;
  }
}
