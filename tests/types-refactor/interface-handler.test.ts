import { Project, SyntaxKind } from 'ts-morph';
import {
  getInterfaces,
  getSourceFile
} from '../../lib/code-refactor/types-refactor/interface-handler/interface-creator/interface-creator';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
import TypeHandler from '../../lib/code-refactor/types-refactor/type-handler/type-handler';
import flatten from './helpers';
import fs, {existsSync} from "fs";

let project: Project;

beforeEach(() => {
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
})

afterEach(() => {
  if (existsSync('ntts-generated-models.ts')) {
    fs.unlinkSync('ntts-generated-models.ts');
  }
})

test('should create interface and set type of variable with object assignment', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a = true ? { c: { a: "a", b: 1 } } : {};',
    { overwrite: true },
  );
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project, '');
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(1);
  const generatedFile = getSourceFile(project, '');
  const A = generatedFile.getInterface((i) => i.getName() === 'A');
  const C = generatedFile.getInterface((i) => i.getName() === 'C');
  expect(A).not.toBeUndefined();
  expect(C).not.toBeUndefined();
  if (A && C) {
    expect(flatten(A)).toEqual(`export interface A { c?: ${TypeHandler.getType(C).getText()} | undefined; }`);
    expect(flatten(C)).toEqual('export interface C { a: string; b: number; }');
    console.log(sourceFile.getText())
    expect(sourceFile.getText())
      .toEqual(`let a: ${TypeHandler.getType(A).getText()} = true ? { c: { a: "a", b: 1 } } : {};`);
  }
});

test('should create interface and replace object type with interface', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: { a: number; b: string; };', { overwrite: true });
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project, '');
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

test('should create interface and replace object union type with interface with nested type literals', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a: { a: { c: { d: number; } }; [key: string]: { o: 12; }; } | { a: { c: { d: string; }; }; };',
    {overwrite: true},
  );
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project, '');
  const interfaces = getInterfaces(project, '');
  const A = interfaces.find((i) => i.getName() === 'A');
  const _A = interfaces.find((i) => i.getName() === '_A');
  const C = interfaces.find((i) => i.getName() === 'C');
  const Key = interfaces.find((i) => i.getName() === 'Key');
  expect(A).not.toBeUndefined();
  expect(_A).not.toBeUndefined();
  expect(C).not.toBeUndefined();
  expect(Key).not.toBeUndefined();
  if (A && _A && C && Key) {
    expect(sourceFile.getText()).toEqual(`let a: ${TypeHandler.getType(A).getText()};`);
    expect(flatten(A))
      .toEqual(`export interface A { a: ${TypeHandler.getType(_A).getText()}; [key: string]: ${TypeHandler.getType(Key).getText()}; }`);
    expect(flatten(_A)).toEqual(`export interface _A { c: ${TypeHandler.getType(C).getText()}; }`);
    expect(flatten(C)).toEqual(`export interface C { d: string | number; }`);
    expect(flatten(Key)).toEqual(`export interface Key { o: number; }`);
  }
});


test('should create interface and replace object union type with interface', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a: { a: number; b: string; } | { a: string; c: number; };',
    { overwrite: true },
  );
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project, '');
  expect(sourceFile.getDescendantsOfKind(SyntaxKind.ImportType).length).toEqual(1);
  const generatedFile = getSourceFile(project, '');
  const interfaceDeclaration = generatedFile.getInterface((i) => i.getName() === 'A');
  expect(flatten(interfaceDeclaration))
    .toEqual('export interface A { a: string | number; b?: string; c?: number; }');
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
  expect(flatten(interfaceDeclaration)).toEqual('export interface A { a: string | number; b?: string; c?: number; }');
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
  TypesRefactor.createInterfacesFromObjectTypes(sourceFile, project, '');
  const generatedFile = getSourceFile(project, '');
  const interfaceDeclaration = generatedFile.getInterface((i) => i.getName() === 'A');
  expect(flatten(interfaceDeclaration)).toEqual('export interface A { a: number; b: string; }');
  expect(interfaceDeclaration).not.toBeUndefined();
  if (interfaceDeclaration) {
    expect(sourceFile.getText()).toEqual(`let a: () => ${TypeHandler.getType(interfaceDeclaration).getText()};`);
  }
});
