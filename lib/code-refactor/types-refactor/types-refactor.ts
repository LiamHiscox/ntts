import {
  Node,
  Project,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';
import Logger from '../../logger/logger';
import InitialTypeHandler from './initial-type-handler/initial-type-handler';
import ParameterTypeInference from './parameter-type-inference/parameter-type-inference';
import WriteAccessTypeInference from './write-access-type-inference/write-access-type-inference';
import ContextualTypeInference from './contextual-type-inference/contextual-type-inference';
import InterfaceHandler from './interface-handler/interface-handler';
import InterfaceUsageInference from './interface-usage-inference/interface-usage-inference';
import { getInterfaces } from './interface-handler/interface-creator/interface-creator';
import InterfaceMerger from './interface-merger/interface-merger';
import InvalidTypeReplacer from './invalid-type-replacer/invalid-type-replacer';
import TypeNodeRefactor from './type-node-refactor/type-node-refactor';

class TypesRefactor {
  static createInterfacesFromObjectTypes = (sourceFile: SourceFile, project: Project, target: string) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return undefined;
      }
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant) || Node.isParameterDeclaration(descendant)) {
        return InterfaceHandler.createInterfaceFromObjectLiterals(descendant, project, target);
      }
      return undefined;
    });
  };

  static checkInterfaceProperties = (project: Project, target: string) => {
    const interfaces = getInterfaces(project, target);
    if (interfaces.length > 0) {
      interfaces.forEach((interfaceDeclaration) => {
        Logger.info(interfaceDeclaration.getName());
        InterfaceUsageInference.checkProperties(interfaceDeclaration, interfaces, project, target);
      });
    }
  };

  static mergeDuplicateInterfaces = (project: Project, target: string) => {
    const interfaces = getInterfaces(project, target);
    InterfaceMerger.mergeDuplicates(interfaces);
  };

  static addPropertiesFromUsageOfInterface = (sourceFile: SourceFile, project: Project, target: string) => {
    Logger.info(sourceFile.getFilePath());
    const interfaces = getInterfaces(project, target);
    if (interfaces.length > 0) {
      sourceFile.getDescendants().forEach((descendant) => {
        if (descendant.wasForgotten()) {
          return;
        }
        if (Node.isElementAccessExpression(descendant) || Node.isIdentifier(descendant)) {
          InterfaceUsageInference.addPropertiesByUsage(descendant, interfaces);
        }
      });
    }
  };

  static replaceInvalidTypes = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach((descendant) => {
      if (!descendant.wasForgotten() && Node.isParameterDeclaration(descendant)) {
        InvalidTypeReplacer.replaceAnyAndNeverType(descendant);
      }
      /*
      if (Node.isParameterDeclaration(descendant)
        || Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
        || Node.isPropertySignature(descendant))
        return InvalidTypeReplacer.replaceAnyAndNeverType(descendant);
      */
    });
  };

  static inferContextualType = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return undefined;
      }
      if (Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
        || Node.isParameterDeclaration(descendant)) {
        return ContextualTypeInference.inferTypeByContextualType(descendant);
      }
      return undefined;
    });
  };

  static inferWriteAccessType = (sourceFile: SourceFile, project: Project, target: string) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return undefined;
      }
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant)) {
        return WriteAccessTypeInference.inferTypeByWriteAccess(descendant, project, target);
      }
      return undefined;
    });
  };

  static inferParameterTypes = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return undefined;
      }
      if (Node.isSetAccessorDeclaration(descendant)) {
        return ParameterTypeInference.inferSetAccessorParameterTypes(descendant);
      }
      if (Node.isPropertyAssignment(descendant)
        || Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)) {
        return ParameterTypeInference.inferFunctionAssignmentParameterTypes(descendant);
      }
      if (Node.isFunctionDeclaration(descendant)
        || Node.isMethodDeclaration(descendant)) {
        return ParameterTypeInference.inferFunctionDeclarationParameterTypes(descendant);
      }
      if (Node.isConstructorDeclaration(descendant)) {
        return ParameterTypeInference.inferConstructorParameterTypes(descendant);
      }
      return undefined;
    });
  };

  static refactorImportTypesAndTypeReferences = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return;
      }
      if (Node.isImportTypeNode(descendant)) {
        TypeNodeRefactor.refactor(descendant, sourceFile);
      }
      if (Node.isTypeReference(descendant)) {
        TypeNodeRefactor.importGlobalTypes(descendant, sourceFile);
      }
    });
    sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).forEach((importType) => {
      if (!importType.wasForgotten()) {
        TypeNodeRefactor.refactor(importType, sourceFile);
      }
    });
  };

  static setInitialTypes = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath());
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return;
      }
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant)) {
        InitialTypeHandler.setInitialType(descendant);
      }
    });
  };
}

export default TypesRefactor;
