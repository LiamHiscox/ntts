import {Project, SyntaxKind} from "ts-morph";
import {InterfaceHandler} from "../../lib/code-refactor/types-refactor/interface-handler/interface-handler";
import {getSourceFile} from "../../lib/code-refactor/types-refactor/interface-handler/interface-creator/interface-creator";
import {TypesRefactor} from "../../lib/code-refactor/types-refactor/types-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should create interface and set type of variable with object assignment', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a = true ? { auth: { a: "a", b: 1 } } : {};', {overwrite: true});
  sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(declaration => InterfaceHandler.createInterfaceFromObjectLiterals(declaration, project))
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(1);
  const generatedFile = getSourceFile(project);
  expect(generatedFile.getInterface(i => i.getName() === "A")).not.toBeUndefined();
});

test('should create interface and replace object type with interface', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: { a: number; b: string; };', {overwrite: true});
  sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(declaration => InterfaceHandler.createInterfaceFromObjectLiterals(declaration, project))
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(1);
  const generatedFile = getSourceFile(project);
  expect(generatedFile.getInterface(i => i.getName() === "A")).not.toBeUndefined();
});

test('should create interface and replace object union type with interface', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: { a: number; b: string; } | { a?: string; c: number; };', {overwrite: true});
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project);
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(1);
  const generatedFile = getSourceFile(project);
  expect(generatedFile.getInterface(i => i.getName() === "A")).not.toBeUndefined();
});

test('should create interface and replace object union type with object 2', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: { a: number; b: string; } | { a: string; c: number; } | undefined;', {overwrite: true});
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project);
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(1);
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.UnionType).length).toEqual(1);
  const generatedFile = getSourceFile(project);
  expect(generatedFile.getInterface(i => i.getName() === "A")).not.toBeUndefined();
});

test('should create interface and replace object union type with interface 2', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: import("path").PlatformPath | { a: string; c: number; } | undefined;', {overwrite: true});
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project);
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(2);
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.UnionType).length).toEqual(1);
  const generatedFile = getSourceFile(project);
  expect(generatedFile.getInterface(i => i.getName() === "A")).not.toBeUndefined();
});

test('should extend interface with given object types', () => {
  const interfaceDeclaration = getSourceFile(project).addInterface({name: "Empty", isExported: true});
  const sourceFile = project.createSourceFile('write-access.ts', `let a: ${interfaceDeclaration.getType().getText()} | { a: number; b: string; };`, {overwrite: true});
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project);
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(1);
  expect(interfaceDeclaration.getProperties().length).toEqual(2);
});

