import {
  InterfaceDeclaration,
  Project,
  SourceFile,
  TypeElementTypes,
  Node
} from "ts-morph";
import {VariableNameGenerator} from "../../../helpers/variable-name-generator/variable-name-generator";
import {existsSync, writeFileSync} from "fs";
import {TypeSimplifier} from "../../helpers/type-simplifier/type-simplifier";
import {TypeHandler} from "../../type-handler/type-handler";
import { join } from "path";

const generatedFileName = 'ntts-generated-models.ts';

export const getInterfaces = (project: Project, target: string): InterfaceDeclaration[] => {
  const sourceFile = getSourceFile(project, target);
  return sourceFile.getInterfaces();
}

export const getInterface = (name: string, project: Project, target: string): InterfaceDeclaration => {
  const sourceFile = getSourceFile(project, target);
  const _interface = sourceFile.getInterface((i) => i.getName() === name);
  return _interface || createInterface(name, project, target);
}

export const createInterface = (name: string, project: Project, target: string, members?: TypeElementTypes[]): InterfaceDeclaration => {
  const sourceFile = getSourceFile(project, target);
  const names = sourceFile.getInterfaces().map(i => i.getName());
  const usableName = VariableNameGenerator.getUsableVariableName(toInterfaceFormat(name), names);
  const declaration = sourceFile.addInterface({name: usableName, isExported: true});
  members?.forEach(member => {
    const newMember = declaration.addMember(member.getText());
    if (Node.isPropertySignature(newMember)) {
      const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getTypeNode(newMember));
      stringSimplified && TypeHandler.setTypeFiltered(newMember, stringSimplified);
    }
    if (Node.isIndexSignatureDeclaration(newMember)) {
      const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getReturnTypeNode(newMember));
      stringSimplified && TypeHandler.setReturnTypeFiltered(newMember, stringSimplified);
    }
  })
  return declaration;
}

export const getSourceFile = (project: Project, target: string): SourceFile => {
  const fullPath = join(target, generatedFileName);
  return project.getSourceFile(fullPath) || createInterfaceFile(project, fullPath);
}

const createInterfaceFile = (project: Project, fullPath: string): SourceFile => {
  if (!existsSync(fullPath)) {
    writeFileSync(fullPath, "");
  }
  return project.addSourceFileAtPath(fullPath);
}

const toInterfaceFormat = (str: string) => {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/(^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
    .replace(/\s+/g, '');
}
