import { Project, SyntaxKind } from 'ts-morph';
import InterfaceHandler from '../../lib/code-refactor/types-refactor/interface-handler/interface-handler';
import { getSourceFile } from '../../lib/code-refactor/types-refactor/interface-handler/interface-creator/interface-creator';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
import TypeHandler from '../../lib/code-refactor/types-refactor/type-handler/type-handler';
import flatten from './helpers';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should create interface and set type of variable with object assignment', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a = true ? { auth: { a: "a", b: 1 } } : {};',
    { overwrite: true },
  );
  sourceFile
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .forEach((declaration) => InterfaceHandler.createInterfaceFromObjectLiterals(declaration, project, ''));
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(1);
  const generatedFile = getSourceFile(project, '');
  const interfaceDeclaration = generatedFile.getInterface((i) => i.getName() === 'A');
  expect(flatten(interfaceDeclaration))
    .toEqual('export interface A { auth?: { a: string; b: number; } | undefined; }');
  expect(interfaceDeclaration).not.toBeUndefined();
  if (interfaceDeclaration) {
    expect(sourceFile.getText())
      .toEqual(`let a: ${TypeHandler.getType(interfaceDeclaration).getText()} = true ? { auth: { a: "a", b: 1 } } : {};`);
  }
});

test('should create interface and replace object type with interface', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: { a: number; b: string; };', { overwrite: true });
  sourceFile
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .forEach((declaration) => InterfaceHandler.createInterfaceFromObjectLiterals(declaration, project, ''));
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(1);
  const generatedFile = getSourceFile(project, '');
  const interfaceDeclaration = generatedFile.getInterface((i) => i.getName() === 'A');
  expect(flatten(interfaceDeclaration)).toEqual('export interface A { a: number; b: string; }');
  expect(interfaceDeclaration).not.toBeUndefined();
  if (interfaceDeclaration) {
    expect(sourceFile.getText())
      .toEqual(`let a: ${TypeHandler.getType(interfaceDeclaration).getText()};`);
  }
});

test('should create interface and replace object union type with interface', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a: { a: number; b: string; } | { a?: string; c: number; };',
    { overwrite: true },
  );
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project, '');
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(1);
  const generatedFile = getSourceFile(project, '');
  const interfaceDeclaration = generatedFile.getInterface((i) => i.getName() === 'A');
  expect(flatten(interfaceDeclaration))
    .toEqual('export interface A { a?: string | number | undefined; b?: string; c?: number; }');
  expect(interfaceDeclaration).not.toBeUndefined();
  if (interfaceDeclaration) {
    expect(sourceFile.getText())
      .toEqual(`let a: ${TypeHandler.getType(interfaceDeclaration).getText()};`);
  }
});

test('should create interface and replace object union type with object 2', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a: { a: number; b: string; } | { a: string; c: number; } | undefined;',
    { overwrite: true },
  );
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project, '');
  const generatedFile = getSourceFile(project, '');
  const interfaceDeclaration = generatedFile.getInterface((i) => i.getName() === 'A');
  expect(flatten(interfaceDeclaration)).toEqual('export interface A { a: string; b?: string | undefined; c?: number | undefined; }');
  expect(interfaceDeclaration).not.toBeUndefined();
  if (interfaceDeclaration) {
    expect(sourceFile.getText())
      .toEqual(`let a: ${TypeHandler.getType(interfaceDeclaration).getText()} | undefined;`);
  }
});

test('should create interface and replace object union type with interface 2', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a: import("path").PlatformPath | { a: string; c: number; } | undefined;',
    { overwrite: true },
  );
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project, '');
  const generatedFile = getSourceFile(project, '');
  const interfaceDeclaration = generatedFile.getInterface((i) => i.getName() === 'A');
  expect(flatten(interfaceDeclaration)).toEqual('export interface A { a: string; c: number; }');
  expect(interfaceDeclaration).not.toBeUndefined();
  if (interfaceDeclaration) {
    expect(sourceFile.getText())
      .toEqual(`let a: import("path").PlatformPath | ${TypeHandler.getType(interfaceDeclaration).getText()} | undefined;`);
  }
});

test('should extend interface with given object types', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()} | { a: number; b: string; };`,
    { overwrite: true },
  );
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { a?: number; b?: string; }');
  expect(interfaceDeclaration).not.toBeUndefined();
  if (interfaceDeclaration) {
    expect(sourceFile.getText()).toEqual(`let a: ${TypeHandler.getType(interfaceDeclaration).getText()};`);
  }
});

test('should create interface and replace object type with interface in function return', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a: () => { a: number; b: string; };',
    { overwrite: true },
  );
  sourceFile
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .forEach((declaration) => InterfaceHandler.createInterfaceFromObjectLiterals(declaration, project, ''));
  const generatedFile = getSourceFile(project, '');
  const interfaceDeclaration = generatedFile.getInterface((i) => i.getName() === 'A');
  expect(flatten(interfaceDeclaration)).toEqual('export interface A { a: number; b: string; }');
  expect(interfaceDeclaration).not.toBeUndefined();
  if (interfaceDeclaration) {
    expect(sourceFile.getText()).toEqual(`let a: () => ${TypeHandler.getType(interfaceDeclaration).getText()};`);
  }
});
