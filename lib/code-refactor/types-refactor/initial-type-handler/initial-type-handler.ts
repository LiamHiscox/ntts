import { PropertyDeclaration, VariableDeclaration } from 'ts-morph';
import TypeHandler from '../type-handler/type-handler.js';
import TypeChecker from '../helpers/type-checker/type-checker.js';

class InitialTypeHandler {
  static setInitialType = (declaration: VariableDeclaration | PropertyDeclaration) => {
    const typeNode = declaration.getTypeNode();
    const initializer = declaration.getInitializer();
    const initializerType = initializer && TypeHandler.getType(initializer);
    const currentType = TypeHandler.getType(declaration);
    if (!typeNode && initializerType && !TypeChecker.isAnyOrUnknown(initializerType) && initializerType.getText() !== currentType.getText()) {
      const combined = TypeHandler.combineTypes(TypeHandler.getType(declaration), initializerType);
      TypeHandler.setTypeFiltered(declaration, combined);
    }
  };
}

export default InitialTypeHandler;
