import {
  Node,
  ParameterDeclaration,
  PropertyDeclaration,
  ReferencedSymbol,
  VariableDeclaration
} from "ts-morph";
import {findReferences} from "../../helpers/reference-finder/reference-finder";
import {TypeHandler} from "../type-handler/type-handler";
import {
  getExpressionParent,
  isAccessExpressionTarget,
  isWriteAccess
} from "../../helpers/expression-handler/expression-handler";
import {isAccessExpression} from "../../helpers/combined-types/combined-types";
import {TypeChecker} from "../helpers/type-checker/type-checker";

export class ContextualTypeInference {
  static inferTypeByContextualType = (declaration: VariableDeclaration | PropertyDeclaration | ParameterDeclaration) => {
    const type = TypeHandler.getType(declaration);
    if (type.isAny() || type.isUnknown()) {
      const nameNode = declaration.getNameNode();
      if (Node.isObjectBindingPattern(nameNode) || Node.isArrayBindingPattern(nameNode)) {

      } else {
        const newTypes = findReferences(declaration).reduce((types, ref) => types.concat(...this.checkReferences(ref, declaration)), new Array<string>());
        TypeHandler.addTypes(declaration, ...newTypes);
      }
    }
  }

  private static checkReferences = (referencedSymbol: ReferencedSymbol, declaration: VariableDeclaration | PropertyDeclaration | ParameterDeclaration): string[] => {
    return referencedSymbol.getReferences().reduce((types, reference) => {
      const node = reference.getNode();
      const writeAccess = reference.isWriteAccess() || isWriteAccess(node);
      if (!reference.isDefinition() && !writeAccess) {
        const newType = this.checkForContextualType(node, declaration);
        return newType ? types.concat(newType) : types;
      }
      return types;
    }, new Array<string>())
  }

  private static checkForContextualType = (node: Node, declaration: VariableDeclaration | PropertyDeclaration | ParameterDeclaration): string | undefined => {
    const innerExpression = getExpressionParent(node);
    if (isAccessExpression(innerExpression) && isAccessExpressionTarget(innerExpression, node)) {
      const type = innerExpression.getContextualType();
      const currentType = TypeHandler.getType(declaration);

      if (type && currentType.isArray() && !TypeChecker.isAny(type)) {
        return type.getText();
      } else if (type && !type.isAny()) {
        return type.getText();
      }
    }
    return;
  }
}
