import {
  Node,
  ParameterDeclaration,
  Project,
  PropertyDeclaration,
  PropertySignature,
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
import InterfaceHandler from "../interface-handler/interface-handler";

class ContextualTypeInference {
  static inferTypeByContextualType = (
    declaration: VariableDeclaration | PropertyDeclaration | ParameterDeclaration | PropertySignature,
    project: Project,
    target: string
    ) => {
    const type = TypeHandler.getType(declaration);
    const nameNode = declaration.getNameNode();
    if (TypeChecker.isAnyOrUnknown(type) && !Node.isObjectBindingPattern(nameNode) && !Node.isArrayBindingPattern(nameNode)) {
      const newTypes = findReferences(declaration)
        .reduce((types: string[], ref) => types.concat(...this.checkReferences(ref)), []);
      const combined = TypeHandler.combineTypeWithList(TypeHandler.getType(declaration), ...newTypes);
      if (newTypes.length > 0) {
        TypeHandler.setTypeFiltered(declaration, combined);
        InterfaceHandler.createInterfaceFromObjectLiterals(declaration, project, target);
      }
    }
  };

  private static checkReferences = (referencedSymbol: ReferencedSymbol): string[] => referencedSymbol
    .getReferences()
    .reduce((types: string[], reference) => {
      const node = reference.getNode();
      const writeAccess = reference.isWriteAccess() || isWriteAccess(node);
      if (!reference.isDefinition() && !writeAccess) {
        const newType = this.checkForContextualType(node);
        return newType ? types.concat(newType) : types;
      }
      return types;
    }, []);

  private static checkForContextualType = (node: Node): string | undefined => {
    const innerExpression = getExpressionParent(node);
    if (isAccessExpression(innerExpression) && isAccessExpressionTarget(innerExpression, node)) {
      const type = innerExpression.getContextualType();
      if (type && !TypeChecker.isAnyOrUnknown(type)) {
        return type.getText();
      }
    }
    return undefined;
  };
}

export default ContextualTypeInference;
