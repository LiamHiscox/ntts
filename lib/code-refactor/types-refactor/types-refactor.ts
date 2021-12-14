import {Node, Project, SourceFile} from "ts-morph";
import {Logger} from "../../logger/logger";
import {InitialTypeHandler} from "./initial-type-handler/initial-type-handler";
import {ParameterTypeInference} from "./parameter-type-inference/parameter-type-inference";
import {UsageTypeInference} from "./usage-type-inference/usage-type-inference";
import {isFieldDeclaration} from "../helpers/combined-types/combined-types";
import {DeepTypeInference} from "./deep-type-inference/deep-type-inference";
import {WriteAccessTypeInference} from "./write-access-type-inference/write-access-type-inference";
import {ContextualTypeInference} from "./contextual-type-inference/contextual-type-inference";
import {InterfaceHandler} from "./interface-handler/interface-handler";

export class TypesRefactor {
  static createInterfacesFromObjectTypes = (sourceFile: SourceFile, project: Project) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant))
        return InterfaceHandler.createInterfaceFromObjectLiterals(descendant, project);
    })
  }

  static inferContextualType = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant) || Node.isParameterDeclaration(descendant))
        return ContextualTypeInference.inferTypeByContextualType(descendant);
    })
  }

  static inferWriteAccessType = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant))
        return WriteAccessTypeInference.inferTypeByWriteAccess(descendant);
    })
  }

  static propagateClassOrInterfaceType = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (isFieldDeclaration(descendant))
        return DeepTypeInference.propagateClassOrInterfaceType(descendant);
    })
  }

  static inferUsageTypes = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath())
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant))
        return UsageTypeInference.inferDeclarationType(descendant);
    })
  }

  static inferParameterTypes = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath())
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (Node.isSetAccessorDeclaration(descendant))
        return ParameterTypeInference.inferSetAccessorParameterTypes(descendant);
      if (Node.isPropertyAssignment(descendant)
        || Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
      ) return ParameterTypeInference.inferFunctionAssignmentParameterTypes(descendant);
      if (Node.isFunctionDeclaration(descendant)
        || Node.isMethodDeclaration(descendant)
      ) return ParameterTypeInference.inferFunctionDeclarationParameterTypes(descendant);
      if (Node.isConstructorDeclaration(descendant))
        return ParameterTypeInference.inferConstructorParameterTypes(descendant);
    })
  }

  static setInitialTypes = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath())
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant))
        return InitialTypeHandler.setInitialType(descendant);
    })
  }
}
