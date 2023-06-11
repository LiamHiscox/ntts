import {Node, Project, SourceFile, SyntaxKind} from 'ts-morph';
import InitialTypeHandler from './initial-type-handler/initial-type-handler';
import ParameterTypeInference from './parameter-type-inference/parameter-type-inference';
import WriteAccessTypeInference from './write-access-type-inference/write-access-type-inference';
import ContextualTypeInference from './contextual-type-inference/contextual-type-inference';
import InterfaceHandler from './interface-handler/interface-handler';
import InterfaceUsageInference from './interface-usage-inference/interface-usage-inference';
import {getInterfaces} from './interface-handler/interface-creator/interface-creator';
import InterfaceMerger from './interface-merger/interface-merger';
import InvalidTypeReplacer from './invalid-type-replacer/invalid-type-replacer';
import TypeNodeRefactor from './type-node-refactor/type-node-refactor';
import {generateProgressBar} from '../helpers/generate-progress-bar/generate-progress-bar';
import Cleanup from './cleanup/cleanup';
import {getInnerExpression} from '../helpers/expression-handler/expression-handler';
import FunctionReturnTypeInference from './function-return-type-inference/function-return-type-inference';
import TypeDeclarationChecker from './type-declaration-checker/type-declaration-checker';

class TypesRefactor {
  static createInterfacesFromObjectTypes = (sourceFile: SourceFile, project: Project, target: string) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return undefined;
      }
      if ((
          Node.isVariableDeclaration(descendant)
          || Node.isPropertyDeclaration(descendant)
          || Node.isParameterDeclaration(descendant)
        )
        && !Node.isCallExpression(descendant.getInitializer())
      ) {
        return InterfaceHandler.createInterfaceFromObjectLiterals(descendant, project, target);
      }
      return undefined;
    });
  };

  static inferInterfaceProperties = (sourceFile: SourceFile, project: Project, target: string) => {
    const interfaces = getInterfaces(project, target);
    if (interfaces.length > 0) {
      sourceFile.getDescendants().reduce((newInterfaces, descendant) => {
        if (descendant.wasForgotten()) {
          return newInterfaces;
        }
        if (Node.isElementAccessExpression(descendant) || Node.isIdentifier(descendant)) {
          return InterfaceUsageInference.addPropertiesByUsage(descendant, newInterfaces, project, target);
        }
        return newInterfaces;
      }, interfaces);
    }
  }

  static mergeDuplicateInterfaces = (project: Project, target: string) => {
    const interfaces = getInterfaces(project, target);
    const bar = generateProgressBar(interfaces.length);
    InterfaceMerger.mergeDuplicates(interfaces, bar);
    const mergedInterfaceCount = getInterfaces(project, target).length;
    if (mergedInterfaceCount < interfaces.length) {
      this.mergeDuplicateInterfaces(project, target);
    }
  };

  static replaceInvalidTypes = (sourceFile: SourceFile, typeAlias: string) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten() || Node.isTypeAliasDeclaration(descendant)) {
        return;
      }
      if (Node.isParameterDeclaration(descendant)) {
        return InvalidTypeReplacer.replaceParameterType(descendant, typeAlias);
      }
      if (Node.isReturnTyped(descendant)) {
        return InvalidTypeReplacer.replaceReturnType(descendant, typeAlias);
      }
      if (Node.isTyped(descendant)) {
        return InvalidTypeReplacer.replaceType(descendant, typeAlias);
      }
      return;
    });
  };

  static inferContextualType = (sourceFile: SourceFile, project: Project, target: string) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return undefined;
      }
      if (
        Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
        || Node.isParameterDeclaration(descendant)
        || Node.isPropertySignature(descendant)
      ) {
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
      if (
        Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
      ) {
        InitialTypeHandler.setInitialType(descendant);
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
      if (
        Node.isPropertyAssignment(descendant)
        || Node.isVariableDeclaration(descendant)
        || Node.isPropertyDeclaration(descendant)
      ) {
        return ParameterTypeInference.inferFunctionAssignmentParameterTypes(descendant, project, target);
      }
      if (
        Node.isFunctionDeclaration(descendant)
        || Node.isMethodDeclaration(descendant)
      ) {
        return ParameterTypeInference.inferFunctionDeclarationParameterTypes(descendant, project, target);
      }
      if (Node.isConstructorDeclaration(descendant)) {
        return ParameterTypeInference.inferConstructorParameterTypes(descendant, project, target);
      }
      return undefined;
    });
  };

  static inferFunctionTypeParameterTypes = (sourceFile: SourceFile, project: Project, target: string) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return undefined;
      }
      if (
        (Node.isVariableDeclaration(descendant) || Node.isPropertyDeclaration(descendant))
        && !Node.isArrowFunction(getInnerExpression(descendant.getInitializer()))
        && !Node.isFunctionExpression(getInnerExpression(descendant.getInitializer()))
      ) {
        return ParameterTypeInference.inferFunctionTypeParameterTypes(descendant, project, target);
      }
      if (Node.isPropertySignature(descendant)) {
        return ParameterTypeInference.inferFunctionTypeParameterTypes(descendant, project, target);
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

  static filterUnionType = (sourceFile: SourceFile) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (!descendant.wasForgotten() && Node.isUnionTypeNode(descendant)) {
        Cleanup.filterUnionType(descendant);
      }
    });
  }

  static removeUndefinedFromOptional = (sourceFile: SourceFile, typeAlias: string) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return;
      }
      if (Node.isPropertySignature(descendant)
        || Node.isParameterDeclaration(descendant)) {
        Cleanup.removeUndefinedFromOptional(descendant, typeAlias);
      }
    });
  }

  static removeNullOrUndefinedTypes = (sourceFile: SourceFile, typeAlias: string) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return;
      }
      if (Node.isReturnTyped(descendant)) {
        return Cleanup.replaceNullOrUndefinedReturnType(descendant, typeAlias);
      }
      if (Node.isTyped(descendant)) {
        return Cleanup.replaceNullOrUndefinedType(descendant, typeAlias);
      }
    });
  }

  static setFunctionReturnTypes = (sourceFile: SourceFile, project: Project, target: string) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return;
      }
      if (
        Node.isFunctionDeclaration(descendant)
        || Node.isArrowFunction(descendant)
        || Node.isMethodDeclaration(descendant)
        || Node.isFunctionExpression(descendant)
        || Node.isGetAccessorDeclaration(descendant)
      ) {
        FunctionReturnTypeInference.checkReturnType(descendant, project, target);
      }
    });
  }

  static removeUnnecessaryTypeNodes = (sourceFile: SourceFile) => {
    sourceFile.getDescendants().forEach((descendant) => {
      if (descendant.wasForgotten()) {
        return;
      }
      if (
        Node.isPropertyDeclaration(descendant)
        || Node.isVariableDeclaration(descendant)
      ) {
        TypeDeclarationChecker.checkTypeNode(descendant);
      }
      if (
        Node.isFunctionDeclaration(descendant)
        || Node.isArrowFunction(descendant)
        || Node.isMethodDeclaration(descendant)
        || Node.isFunctionExpression(descendant)
        || Node.isGetAccessorDeclaration(descendant)
      ) {
        TypeDeclarationChecker.checkReturnTypeNode(descendant);
      }
    })
  }
}

export default TypesRefactor;
