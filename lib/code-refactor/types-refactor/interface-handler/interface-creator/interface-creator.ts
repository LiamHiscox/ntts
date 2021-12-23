import {
  Project,
  SourceFile,
  TypeElementTypes,
  Node,
} from 'ts-morph';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import VariableNameGenerator from '../../../helpers/variable-name-generator/variable-name-generator';
import TypeSimplifier from '../../helpers/type-simplifier/type-simplifier';
import TypeHandler from '../../type-handler/type-handler';

const generatedFileName = 'ntts-generated-models.ts';

const createInterfaceFile = (project: Project, fullPath: string): SourceFile => {
  if (!existsSync(fullPath)) {
    writeFileSync(fullPath, '');
  }
  return project.addSourceFileAtPath(fullPath);
};

export const getSourceFile = (project: Project, target: string): SourceFile => {
  const fullPath = join(target, generatedFileName);
  return project.getSourceFile(fullPath) || createInterfaceFile(project, fullPath);
};

export const getInterfaces = (project: Project, target: string) => {
  const sourceFile = getSourceFile(project, target);
  return sourceFile.getInterfaces();
};

const toInterfaceFormat = (str: string) => str
  .replace(/[^a-zA-Z0-9]+/g, ' ')
  .replace(/(^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
  .replace(/\s+/g, '');

export const createInterface = (name: string, project: Project, target: string, members?: TypeElementTypes[]) => {
  const sourceFile = getSourceFile(project, target);
  const names = sourceFile.getInterfaces().map((i) => i.getName());
  const usableName = VariableNameGenerator.getUsableVariableName(toInterfaceFormat(name), names);
  const declaration = sourceFile.addInterface({ name: usableName, isExported: true });
  members?.forEach((member) => {
    const newMember = declaration.addMember(member.getText());
    if (Node.isPropertySignature(newMember)) {
      const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getTypeNode(newMember));
      stringSimplified && TypeHandler.setTypeFiltered(newMember, stringSimplified);
    }
    if (Node.isIndexSignatureDeclaration(newMember)) {
      const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getReturnTypeNode(newMember));
      stringSimplified && TypeHandler.setReturnTypeFiltered(newMember, stringSimplified);
    }
  });
  return declaration;
};
