import {Node, Project, SourceFile} from "ts-morph";
import {Logger} from "../../logger/logger";
import {InitialTypeHandler} from "./initial-type-handler/initial-type-handler";
import {ParameterTypeInference} from "./parameter-type-inference/parameter-type-inference";
import {WriteAccessTypeInference} from "./write-access-type-inference/write-access-type-inference";
import {ContextualTypeInference} from "./contextual-type-inference/contextual-type-inference";
import {InterfaceHandler} from "./interface-handler/interface-handler";
import {InterfaceUsageInference} from "./interface-usage-inference/interface-usage-inference";
import {getInterfaces} from "./interface-handler/interface-creator/interface-creator";
import {InterfaceMerger} from "./interface-merger/interface-merger";

export class TypesRefactor {
  static createInterfacesFromObjectTypes = (sourceFile: SourceFile, project: Project) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant) || Node.isParameterDeclaration(descendant))
        return InterfaceHandler.createInterfaceFromObjectLiterals(descendant, project);
    })
  }

  static checkInterfaceProperties = (project: Project) => {
    const interfaces = getInterfaces(project);
    if (interfaces.length > 0) {
      getInterfaces(project).forEach(interfaceDeclaration => {
        Logger.info(interfaceDeclaration.getName());
        InterfaceUsageInference.checkProperties(interfaceDeclaration, interfaces, project);
      });
    }
  }

  static mergeDuplicateInterfaces = (project: Project) => {
    const interfaces = getInterfaces(project);
    InterfaceMerger.mergeDuplicates(interfaces);
  }

  static addPropertiesFromUsageOfInterface = (sourceFile: SourceFile, project: Project) => {
    Logger.info(sourceFile.getFilePath());
    const interfaces = getInterfaces(project);
    if (interfaces.length > 0) {
      sourceFile.getDescendants().forEach(descendant => {
        if (descendant.wasForgotten())
          return;
        if (Node.isElementAccessExpression(descendant))
          InterfaceUsageInference.addPropertiesByUsage(descendant.getArgumentExpression(), interfaces);
        if (Node.isIdentifier(descendant))
          InterfaceUsageInference.addPropertiesByUsage(descendant, interfaces);
      })
    }
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

  static inferWriteAccessType = (sourceFile: SourceFile, project: Project) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach(descendant => {
      if (descendant.wasForgotten())
        return;
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant))
        return WriteAccessTypeInference.inferTypeByWriteAccess(descendant, project);
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
