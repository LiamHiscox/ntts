import {
  BindingName,
  ElementAccessExpression,
  Identifier,
  Node,
  PropertySignature,
  ReferencedSymbol,
  ReferenceEntry, SyntaxKind,
  Type
} from "ts-morph";
import {TypeHandler} from "../../type-handler/type-handler";
import {WriteReferenceChecker} from "./write-reference-checker/write-reference-checker";
import {ReadReferenceChecker} from "./read-reference-checker/read-reference-checker";
import {TypeChecker} from "../../helpers/type-checker/type-checker";

export class ReferenceChecker {
  static checkIdentifiers = (bindingName: BindingName): string => {
    if (Node.isIdentifier(bindingName)) {
      return this.checkIdentifierReferences(bindingName) || TypeHandler.getType(bindingName).getText();
    }
    if (Node.isArrayBindingPattern(bindingName)) {
      const newTypes = bindingName.getElements().reduce((acc, element) => {
        if (Node.isOmittedExpression(element))
          return acc.concat(element.getType().getText());
        if (element.getDotDotDotToken())
          return acc;
        return acc.concat(this.checkIdentifiers(element.getNameNode()));
      }, new Array<string>())
      return `[${newTypes.join(', ')}]`;
    }
    const newTypes = bindingName.getElements().reduce((acc, element) => {
      if (element.getDotDotDotToken())
        return acc;
      const propertyName = element.getPropertyNameNode()?.getText() || element.getName();
      const newType = this.checkIdentifiers(element.getNameNode());
      return acc.concat(`${propertyName}: ${newType};`);
    }, new Array<string>());
    return `{ ${newTypes.join(' ')} }`;
  }

  static checkIdentifierReferences = (identifier: Identifier | PropertySignature): string | undefined => {
    const initialType = TypeHandler.getType(identifier);
    const initialTypeList: string[] = TypeChecker.isAny(initialType) ? [] : [initialType.getText()];
    const newTypes = identifier
      .findReferences()
      .reduce((types, ref) => types.concat(...this.checkReferenceEntries(ref, initialType)), new Array<string>())
      .concat(...initialTypeList);
    if (newTypes.length === 1 && initialTypeList.length === 1)
      return;
    return newTypes.length > 0 ? newTypes.join(' | ') : undefined;
  }

  private static checkReferenceEntries = (symbol: ReferencedSymbol, initialType: Type): string[] => {
    return symbol.getReferences().reduce((types, entry) => {
      const type = this.checkReferenceEntryByType(entry, initialType);
      return type ? types.concat(type) : types;
    }, new Array<string>());
  }

  private static checkReferenceEntryByType = (entry: ReferenceEntry, initialType: Type): string | undefined => {
    if (initialType.isArray()) {
      if (!entry.isDefinition() && entry.isWriteAccess()) {
        const result = WriteReferenceChecker.getType(entry.getNode(), initialType);
        return `(${result})[]`;
      }
      const access = this.getElementPropertyAccess(entry.getNode());
      if (!entry.isDefinition() && access && this.isArrayWriteAccess(access)) {
        const result = WriteReferenceChecker.getType(access, initialType);
        return `(${result})[]`;
      }
      if (!entry.isDefinition() && access) {
        const result = ReadReferenceChecker.getType(access, initialType);
        return `(${result})[]`;
      }
    } else {
      if (!entry.isDefinition() && entry.isWriteAccess()) {
        return WriteReferenceChecker.getType(entry.getNode(), initialType);
      }
      if (!entry.isDefinition()) {
        return ReadReferenceChecker.getType(entry.getNode(), initialType);
      }
    }
    return;
  }

  private static isArrayWriteAccess = (access: ElementAccessExpression): boolean => {
    const parent = access.getParent();
    if (Node.isBinaryExpression(parent) && parent.getOperatorToken().asKind(SyntaxKind.EqualsToken) && parent.getLeft().getPos() === access.getPos())
      return true;
    return Node.isPropertyAssignment(parent) && parent.getNameNode().getPos() === access.getPos();
  }

  private static getElementPropertyAccess = (node: Node | undefined): ElementAccessExpression | undefined => {
    if (Node.isElementAccessExpression(node))
      return node;
    if (node && !Node.isPropertyAccessExpression(node))
      return this.getElementPropertyAccess(node.getParent());
    return;
  }
}
