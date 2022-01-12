import { PropertyDeclaration, VariableDeclaration } from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';
import TypeChecker from '../helpers/type-checker/type-checker';

class InitialTypeHandler {
  static setInitialType = (declaration: VariableDeclaration | PropertyDeclaration) => {
    const initializer = declaration.getInitializer();
    const initializerType = initializer && TypeHandler.getType(initializer);
    const currentType = TypeHandler.getType(declaration);
    if (initializerType && !TypeChecker.isAnyOrUnknown(initializerType) && initializerType.getText() !== currentType.getText()) {
      const combined = TypeHandler.combineTypes(TypeHandler.getType(declaration), initializerType);
      TypeHandler.setTypeFiltered(declaration, combined);
    }
  };
}

export default InitialTypeHandler;
