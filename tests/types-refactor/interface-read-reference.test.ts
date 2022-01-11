import { Project } from 'ts-morph';
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
    fs.unlinkSync('ntts-generated-models.ts');  }
})

test('should add properties to interface from property access', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()} = {};\na.b = "asd";\na.c = 12;`,
    { overwrite: true },
  );
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project, '');
  TypesRefactor.checkInterfaceProperties(project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { b?: string | undefined; c?: number | undefined; }');
});

test('should add properties to interface from property access with object binding pattern', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let { a }: { a: ${TypeHandler.getType(interfaceDeclaration).getText()}; } = {a: {}};\na.b = "asd";\na.c = 12;`,
    { overwrite: true },
  );
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project, '');
  TypesRefactor.checkInterfaceProperties(project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { b?: string | undefined; c?: number | undefined; }');
});

test('should not add properties to interface when they already exist', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({
    name: 'Empty',
    properties: [{ name: 'a', type: 'string' }, { name: 'b', type: 'number' }],
    isExported: true,
  });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()} = {};\na.a = false;\na['b'] = false;`,
    { overwrite: true },
  );
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project, '');
  TypesRefactor.checkInterfaceProperties(project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { a: string | boolean; b: number | boolean; }');
});

test('should add properties to interface from element access', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()} = {};\na['b'] = "asd";\na[0] = 12\na[2+2] = true;`,
    { overwrite: true },
  );
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project, '');
  TypesRefactor.checkInterfaceProperties(project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { b?: string | undefined; 0?: number | undefined; [key: number]: boolean; }');
});

test('should not add property of prototype method', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()} = {};\na.hasOwnProperty("a");`,
    { overwrite: true },
  );
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project, '');
  TypesRefactor.checkInterfaceProperties(project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { }');
});

test('should add index signature', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `const a: ${TypeHandler.getType(interfaceDeclaration).getText()} = {};\nconst b = "asd";\na[b] = 12;`,
    { overwrite: true },
  );
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project, '');
  TypesRefactor.checkInterfaceProperties(project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { [key: string]: number; }');
});

test('should add properties to interface from property access in union type', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()} | undefined = {};\na.b = "asd";\na.c = 12;`,
    { overwrite: true },
  );
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project, '');
  TypesRefactor.checkInterfaceProperties(project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { b?: string | undefined; c?: number | undefined; }');
});

test('should add properties to two interfaces from property access in union type', () => {
  const interfaceA = getSourceFile(project, '').addInterface({ name: 'A', isExported: true });
  const interfaceB = getSourceFile(project, '').addInterface({ name: 'B', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceA).getText()} | ${TypeHandler.getType(interfaceB).getText()} = {};\na.b = "asd";\na.c = 12;`,
    { overwrite: true },
  );
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project, '');
  TypesRefactor.checkInterfaceProperties(project, '');
  expect(flatten(interfaceA)).toEqual('export interface A { b?: string | undefined; c?: number | undefined; }');
  expect(flatten(interfaceB)).toEqual('export interface B { b?: string | undefined; c?: number | undefined; }');
});

test('should add properties to interface and inner property from property access', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({
    name: 'Empty',
    isExported: true,
    properties: [{ name: 'b', type: '{}' }],
  });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()} = {b: {}};\na.b.c = "asd";`,
    { overwrite: true },
  );
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project, '');
  TypesRefactor.checkInterfaceProperties(project, '');
  const B = getInterfaces(project, '').find(i => i.getName() === 'B');
  expect(B).not.toBeUndefined();
  if (B) {
    expect(flatten(interfaceDeclaration)).toEqual(`export interface Empty { b: ${TypeHandler.getType(B).getText()}; }`);
    expect(flatten(B)).toEqual('export interface B { c?: string | undefined; }');
  }
});
