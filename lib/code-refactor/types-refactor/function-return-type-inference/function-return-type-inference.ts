import {FunctionDeclaration, ArrowFunction, MethodDeclaration, FunctionExpression, Project} from 'ts-morph';
import InterfaceHandler from '../interface-handler/interface-handler';
import TypeHandler from '../type-handler/type-handler';

class FunctionReturnTypeInference {
  static checkReturnType = (
    fun: FunctionDeclaration | ArrowFunction | MethodDeclaration | FunctionExpression,
    project: Project,
    target: string
  ) => {
    const hasTypeNode = !!fun.getReturnTypeNode();
    const initialType = fun.getReturnType().getText();
    InterfaceHandler.createInterfaceFromObjectLiteralsFunctionReturn(fun, project, target);
    const newType = TypeHandler.getType(fun).getText();
    if (!hasTypeNode && initialType === newType) {
      fun.removeReturnType();
    }
  }
}

export default FunctionReturnTypeInference;