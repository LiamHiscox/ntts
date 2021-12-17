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

const generatedFileName = 'ntts-generated-models.ts';

export const getInterfaces = (project: Project): InterfaceDeclaration[] => {
  const sourceFile = getSourceFile(project);
  return sourceFile.getInterfaces();
}

export const getInterface = (name: string, project: Project): InterfaceDeclaration => {
  const sourceFile = getSourceFile(project);
  const _interface = sourceFile.getInterface((i) => i.getName() === name);
  return _interface || createInterface(name, project);
}

export const createInterface = (name: string, project: Project, members?: TypeElementTypes[]): InterfaceDeclaration => {
  const sourceFile = getSourceFile(project);
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

export const getSourceFile = (project: Project): SourceFile => {
  return project.getSourceFile(generatedFileName) || createInterfaceFile(project);
}

const createInterfaceFile = (project: Project): SourceFile => {
  if (!existsSync(generatedFileName)) {
    writeFileSync(generatedFileName, "");
  }
  return project.addSourceFileAtPath(generatedFileName);
}

const toInterfaceFormat = (str: string) => {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/(^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
    .replace(/\s+/g, '');
}
