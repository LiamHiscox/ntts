import { Node, Project, SourceFile, SyntaxKind } from 'ts-morph';
import InitialTypeHandler from './initial-type-handler/initial-type-handler';
import ParameterTypeInference from './parameter-type-inference/parameter-type-inference';
import WriteAccessTypeInference from './write-access-type-inference/write-access-type-inference';
import ContextualTypeInference from './contextual-type-inference/contextual-type-inference';
import InterfaceHandler from './interface-handler/interface-handler';
import InterfaceUsageInference from './interface-usage-inference/interface-usage-inference';
import { getInterfaces, getSourceFile } from './interface-handler/interface-creator/interface-creator';
import InterfaceMerger from './interface-merger/interface-merger';
import InvalidTypeReplacer from './invalid-type-replacer/invalid-type-replacer';
import TypeNodeRefactor from './type-node-refactor/type-node-refactor';
import { generateProgressBar } from '../helpers/generate-progress-bar/generate-progress-bar';
import Cleanup from "./cleanup/cleanup";

class TypesRefactor {
  static createInterfacesFromObjectTypes = (sourceFile: SourceFile, project: Project, target: string) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return undefined;
      }
      if (Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
        || Node.isParameterDeclaration(descendant)) {
        return InterfaceHandler.createInterfaceFromObjectLiterals(descendant, project, target);
      }
      return undefined;
    });
  };

  static createInterfacesFromTypeLiterals = (project: Project, target: string) => {
    const sourceFile = getSourceFile(project, target);
    InterfaceHandler.createInterfacesFromSourceFile(sourceFile, project, target);
  };

  static checkInterfaceProperties = (project: Project, target: string) => {
    const interfaces = getInterfaces(project, target);
    if (interfaces.length > 0) {
      const bar = generateProgressBar(interfaces.length);
      interfaces.forEach((interfaceDeclaration) => {
        InterfaceUsageInference.checkProperties(interfaceDeclaration, interfaces, project, target);
        bar.tick();
      });
    }
  };

  static mergeDuplicateInterfaces = (project: Project, target: string) => {
    const interfaces = getInterfaces(project, target);
    const bar = generateProgressBar(interfaces.length);
    InterfaceMerger.mergeDuplicates(interfaces, bar);
  };

  static addPropertiesFromUsageOfInterface = (sourceFile: SourceFile, project: Project, target: string) => {
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
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return;
      }
      if (Node.isParameterDeclaration(descendant)) {
        return InvalidTypeReplacer.replaceParameterType(descendant);
      }
      if (Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
        || Node.isPropertySignature(descendant)) {
        return InvalidTypeReplacer.replaceAnyAndNeverType(descendant);
      }
      return;
    });
  };

  static inferContextualType = (sourceFile: SourceFile, project: Project, target: string) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return undefined;
      }
      if (Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
        || Node.isParameterDeclaration(descendant)
        || Node.isPropertySignature(descendant)) {
        return ContextualTypeInference.inferTypeByContextualType(descendant, project, target);
      }
      return undefined;
    });
  };

  static inferWriteAccessType = (sourceFile: SourceFile, project: Project, target: string) => {
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

  static inferParameterTypes = (sourceFile: SourceFile, project: Project, target: string) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return undefined;
      }
      if (Node.isSetAccessorDeclaration(descendant)) {
        return ParameterTypeInference.inferSetAccessorParameterTypes(descendant, project, target);
      }
      if (Node.isPropertyAssignment(descendant)
        || Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)) {
        return ParameterTypeInference.inferFunctionAssignmentParameterTypes(descendant, project, target);
      }
      if (Node.isFunctionDeclaration(descendant)
        || Node.isMethodDeclaration(descendant)) {
        return ParameterTypeInference.inferFunctionDeclarationParameterTypes(descendant, project, target);
      }
      if (Node.isConstructorDeclaration(descendant)) {
        return ParameterTypeInference.inferConstructorParameterTypes(descendant, project, target);
      }
      return undefined;
    });
  };

  static refactorImportTypesAndTypeReferences = (sourceFile: SourceFile) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return;
      }
      if (Node.isImportTypeNode(descendant)) {
        return TypeNodeRefactor.refactor(descendant, sourceFile);
      }
      if (Node.isTypeReference(descendant)) {
        return TypeNodeRefactor.importGlobalTypes(descendant, sourceFile);
      }
      return;
    });
    sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).forEach((importType) => {
      if (!importType.wasForgotten()) {
        TypeNodeRefactor.refactor(importType, sourceFile);
      }
    });
  };

  static setInitialTypes = (sourceFile: SourceFile) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return;
      }
      if (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant)) {
        InitialTypeHandler.setInitialType(descendant);
      }
    });
  };

  static cleanupTypeNodes = (sourceFile: SourceFile) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (!descendant.wasForgotten() && Node.isTyped(descendant)) {
        Cleanup.filterDuplicateTypes(descendant);
      }
    });
  }
}

export default TypesRefactor;
