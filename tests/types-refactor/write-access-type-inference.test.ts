import { Project } from 'ts-morph';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
import { getInterfaces } from "../../lib/code-refactor/types-refactor/interface-handler/interface-creator/interface-creator";
import flatten from "./helpers";
import fs, {existsSync} from "fs";
import TypeHandler from "../../lib/code-refactor/types-refactor/type-handler/type-handler";

let project: Project;

beforeEach(() => {
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
})

afterEach(() => {
  if (existsSync('ntts-generated-models-ts')) {
    fs.rmSync('ntts-generated-models-ts');
  }
})

test('should set type of mutable variable according to write access', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a = "asd";\na = 12;', { overwrite: true });
  TypesRefactor.inferWriteAccessType(sourceFile, project, '');
  expect(sourceFile.getText()).toEqual('let a: string | number = "asd";\na = 12;');
});

test('should not set type of const variable according to write access', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'const a = "asd";\na = 12;', { overwrite: true });
  TypesRefactor.inferWriteAccessType(sourceFile, project, '');
  expect(sourceFile.getText()).toEqual('const a = "asd";\na = 12;');
});

test('should set type of property according to write access', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'class A {\nprop = "asd";\nconstructor() { this.prop = true; }\n}\nconst a = new A();\na.prop = 12;',
    { overwrite: true },
  );
  TypesRefactor.inferWriteAccessType(sourceFile, project, '');
  expect(sourceFile.getText())
    .toEqual('class A {\nprop: string | number | boolean = "asd";\nconstructor() { this.prop = true; }\n}\nconst a = new A();\na.prop = 12;');
});

test('should set type of string property according to write access', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'class A {\n"prop" = "asd";\nconstructor() { this.prop = true; }\n}\nconst a = new A();\na["prop"] = 12;',
    { overwrite: true },
  );
  TypesRefactor.inferWriteAccessType(sourceFile, project, '');
  expect(sourceFile.getText())
    .toEqual('class A {\n"prop": string | number | boolean = "asd";\nconstructor() { this.prop = true; }\n}\nconst a = new A();\na["prop"] = 12;');
});

test('should set type of number property according to write access', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'class A {\n0 = "asd";\nconstructor() { this[0] = true; }\n}\nconst a = new A();\na["0"] = 12;',
    { overwrite: true },
  );
  TypesRefactor.inferWriteAccessType(sourceFile, project, '');
  expect(sourceFile.getText())
    .toEqual('class A {\n0: string | number | boolean = "asd";\nconstructor() { this[0] = true; }\n}\nconst a = new A();\na["0"] = 12;');
});

test('should create interface from write access', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a = "fun";\na = { b: true }',
    { overwrite: true },
  );
  TypesRefactor.inferWriteAccessType(sourceFile, project, '');
  const declaration = getInterfaces(project, '').find(i => i.getName() === 'A');
  expect(declaration).not.toBeUndefined();
  if (declaration) {
    expect(flatten(declaration)).toEqual('export interface A { b: boolean; }');
  }
});

test('should combine object literal types', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'const a: { a: number } | { b: { c: string } } | { a: number } | { b: { c: boolean; d: string } } = fun();',
    { overwrite: true },
  );
  TypesRefactor.inferWriteAccessType(sourceFile, project, '');
  const A = getInterfaces(project, '').find(i => i.getName() === 'A');
  const B = getInterfaces(project, '').find(i => i.getName() === 'B');
  expect(A).not.toBeUndefined();
  expect(B).not.toBeUndefined();
  if (A && B) {
    expect(flatten(A)).toEqual(`export interface A { a?: number | undefined; b?: ${TypeHandler.getType(B).getText()} | undefined; }`);
    expect(flatten(B)).toEqual('export interface B { c: string | boolean; d?: string; }');
  }
});

test('should combine object literal types with index signatures', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'const a: { [key: string]: number } | { [key: number]: string } = fun();',
    { overwrite: true },
  );
  TypesRefactor.inferWriteAccessType(sourceFile, project, '');
  const declaration = getInterfaces(project, '').find(i => i.getName() === 'A');
  expect(declaration).not.toBeUndefined();
  if (declaration) {
    expect(flatten(declaration))
      .toEqual('export interface A { [key: string]: string | number; [key: number]: string | number; }');
  }
});

test('should combine object literal types with index signatures 2', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'const a: { [key: string]: {a: string} } | { [key: number]: {a: number, b: boolean} } = fun();',
    { overwrite: true },
  );
  TypesRefactor.inferWriteAccessType(sourceFile, project, '');
  const A = getInterfaces(project, '').find(i => i.getName() === 'A');
  const Key = getInterfaces(project, '').find(i => i.getName() === 'Key');
  expect(A).not.toBeUndefined();
  expect(Key).not.toBeUndefined();
  if (A && Key) {
    expect(flatten(Key)).toEqual(
      'export interface Key { a: string | number; b?: boolean | undefined; }');
    expect(flatten(A)).toEqual(
      `export interface A { [key: string]: ${TypeHandler.getType(Key).getText()}; [key: number]: ${TypeHandler.getType(Key).getText()}; }`);
  }
});
