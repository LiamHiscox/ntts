import {PropertyDeclaration, VariableDeclaration} from "ts-morph";
import {TypeHandler} from "../type-handler/type-handler";
import {TypeChecker} from "../helpers/type-checker/type-checker";

export class InitialTypeHandler {
  static setInitialType = (declaration: VariableDeclaration | PropertyDeclaration) => {
    const initializerType = declaration.getInitializer()?.getType().getBaseTypeOfLiteralType();
    const currentType = TypeHandler.getType(declaration).getText();
    if (initializerType && !TypeChecker.isAnyOrUnknown(initializerType) && initializerType.getText() !== currentType) {
      TypeHandler.addType(declaration, initializerType.getText());
    }
  }
}
