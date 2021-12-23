import {
  Node,
  ParameterDeclaration,
  PropertyDeclaration,
  ReferencedSymbol,
  VariableDeclaration,
} from 'ts-morph';
import {
  getExpressionParent,
  isAccessExpressionTarget,
  isWriteAccess,
} from '../../helpers/expression-handler/expression-handler';
import { findReferences } from '../../helpers/reference-finder/reference-finder';
import { isAccessExpression } from '../../helpers/combined-types/combined-types';
import TypeHandler from '../type-handler/type-handler';
import TypeChecker from '../helpers/type-checker/type-checker';

class ContextualTypeInference {
  static inferTypeByContextualType = (declaration: VariableDeclaration | PropertyDeclaration | ParameterDeclaration) => {
    const type = TypeHandler.getType(declaration);
    const nameNode = declaration.getNameNode();
    if ((type.isAny() || type.isUnknown()) && !Node.isObjectBindingPattern(nameNode) && !Node.isArrayBindingPattern(nameNode)) {
      const newTypes = findReferences(declaration)
        .reduce((types: string[], ref) => types.concat(...this.checkReferences(ref, declaration)), []);
      TypeHandler.addTypes(declaration, ...newTypes);
    }
  };

  private static checkReferences = (
    referencedSymbol: ReferencedSymbol,
    declaration: VariableDeclaration | PropertyDeclaration | ParameterDeclaration,
  ): string[] => referencedSymbol
    .getReferences()
    .reduce((types: string[], reference) => {
      const node = reference.getNode();
      const writeAccess = reference.isWriteAccess() || isWriteAccess(node);
      if (!reference.isDefinition() && !writeAccess) {
        const newType = this.checkForContextualType(node, declaration);
        return newType ? types.concat(newType) : types;
      }
      return types;
    }, []);

  private static checkForContextualType = (
    node: Node,
    declaration: VariableDeclaration | PropertyDeclaration | ParameterDeclaration,
  ): string | undefined => {
    const innerExpression = getExpressionParent(node);
    if (isAccessExpression(innerExpression) && isAccessExpressionTarget(innerExpression, node)) {
      const type = innerExpression.getContextualType();
      const currentType = TypeHandler.getType(declaration);
      if (type && currentType.isArray() && !TypeChecker.isAny(type)) {
        return type.getText();
      }
      if (type && !type.isAny()) {
        return type.getText();
      }
    }
    return undefined;
  };
}

export default ContextualTypeInference;
