import {Node, SourceFile} from "ts-morph";
import {Logger} from "../../logger/logger";
import {InitialTypeHandler} from "./initial-type-handler/initial-type-handler";
import {TypeInference} from "./type-inference/type-inference";

export class TypesRefactor {
  static inferParameterTypes = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath())
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (Node.isSetAccessorDeclaration(descendant))
        return TypeInference.inferSetAccessorParameterTypes(descendant);
      if (Node.isPropertyAssignment(descendant)
        || Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
      ) return TypeInference.inferFunctionAssignmentParameterTypes(descendant);
      if (Node.isFunctionDeclaration(descendant)
        || Node.isMethodDeclaration(descendant)
      ) return TypeInference.inferFunctionDeclarationParameterTypes(descendant);
      if (Node.isConstructorDeclaration(descendant))
        return TypeInference.inferConstructorParameterTypes(descendant);
    })
  }

  static declareInitialTypes = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath())
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
      ) return InitialTypeHandler.refactorVariableOrProperty(descendant);
      if (Node.isArrowFunction(descendant))
        return InitialTypeHandler.refactorArrowFunction(descendant);
      if (Node.isFunctionExpression(descendant)
        || Node.isFunctionDeclaration(descendant)
        || Node.isMethodDeclaration(descendant)
        || Node.isGetAccessorDeclaration(descendant)
        || Node.isSetAccessorDeclaration(descendant)
      ) return InitialTypeHandler.refactorFunction(descendant);
    })
  }
}
