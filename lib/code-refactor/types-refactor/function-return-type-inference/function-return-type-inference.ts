import {FunctionDeclaration, ArrowFunction, MethodDeclaration, FunctionExpression, Project, GetAccessorDeclaration} from 'ts-morph';
import InterfaceHandler from '../interface-handler/interface-handler.js';

class FunctionReturnTypeInference {
  static checkReturnType = (
    fun: FunctionDeclaration | ArrowFunction | MethodDeclaration | FunctionExpression | GetAccessorDeclaration,
    project: Project,
    target: string
  ) => {
    const hasTypeNode = !!fun.getReturnTypeNode();
    const initialType = fun.getReturnType().getText();
    InterfaceHandler.createInterfaceFromObjectLiteralsFunctionReturn(fun, project, target);
    const newType = fun.getReturnType().getText();
    if (!hasTypeNode && initialType === newType) {
      fun.removeReturnType();
    }
  }
}

export default FunctionReturnTypeInference;
