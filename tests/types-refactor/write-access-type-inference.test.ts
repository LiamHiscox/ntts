import {Project} from "ts-morph";
import {TypesRefactor} from "../../lib/code-refactor/types-refactor/types-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should set type of mutable variable according to write access', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a = "asd";\na = 12;', {overwrite: true});
  TypesRefactor.inferWriteAccessType(sourceFile, project, "");
  expect(sourceFile.getText()).toEqual('let a: string | number = "asd";\na = 12;');
});

test('should not set type of const variable according to write access', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'const a = "asd";\na = 12;', {overwrite: true});
  TypesRefactor.inferWriteAccessType(sourceFile, project, "");
  expect(sourceFile.getText()).toEqual('const a = "asd";\na = 12;');
});

test('should set type of property according to write access', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'class A {\nprop = "asd";\nconstructor() { this.prop = true; }\n}\nconst a = new A();\na.prop = 12;', {overwrite: true});
  TypesRefactor.inferWriteAccessType(sourceFile, project, "");
  expect(sourceFile.getText()).toEqual('class A {\nprop: string | number | boolean = "asd";\nconstructor() { this.prop = true; }\n}\nconst a = new A();\na.prop = 12;');
});

test('should set type of string property according to write access', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'class A {\n"prop" = "asd";\nconstructor() { this.prop = true; }\n}\nconst a = new A();\na["prop"] = 12;', {overwrite: true});
  TypesRefactor.inferWriteAccessType(sourceFile, project, "");
  expect(sourceFile.getText()).toEqual('class A {\n"prop": string | number | boolean = "asd";\nconstructor() { this.prop = true; }\n}\nconst a = new A();\na["prop"] = 12;');
});

test('should set type of number property according to write access', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'class A {\n0 = "asd";\nconstructor() { this[0] = true; }\n}\nconst a = new A();\na["0"] = 12;', {overwrite: true});
  TypesRefactor.inferWriteAccessType(sourceFile, project, "");
  expect(sourceFile.getText()).toEqual('class A {\n0: string | number | boolean = "asd";\nconstructor() { this[0] = true; }\n}\nconst a = new A();\na["0"] = 12;');
});

test('should combine object literal types', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'const a: { a: number } | { b: { c: string } } | { a: number } | { b: { c: boolean; d: string } } = fun();', {overwrite: true});
  TypesRefactor.inferWriteAccessType(sourceFile, project, "");
  expect(sourceFile.getText()).toEqual('const a: { a: number; b: { c: string | boolean; d: string; }; } = fun();');
});

test('should combine object literal types with index signatures', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'const a: { [key: string]: number } | { [key: number]: string } = fun();', {overwrite: true});
  TypesRefactor.inferWriteAccessType(sourceFile, project, "");
  expect(sourceFile.getText()).toEqual('const a: { [key: string]: string | number; [key: number]: string | number; } = fun();');
});

test('should combine object literal types with index signatures 2', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'const a: { [key: string]: {a: string} } | { [key: number]: {a: number, b: boolean} } = fun();', {overwrite: true});
  TypesRefactor.inferWriteAccessType(sourceFile, project, "");
  expect(sourceFile.getText()).toEqual('const a: { [key: string]: { a: string | number; b: boolean; }; [key: number]: { a: string | number; b: boolean; }; } = fun();');
});

test('should not change type of interface type', () => {
  const sourceFile = project.createSourceFile('write-access.ts', '', {overwrite: true});
  const interfacePath = sourceFile.getFilePath().replace(/\.ts$/, '');
  sourceFile.replaceWithText(`export interface A {};\nlet a: import("${interfacePath}").A;\na = {};`)
  TypesRefactor.inferWriteAccessType(sourceFile, project, "");
  expect(sourceFile.getText()).toEqual(`export interface A {};\nlet a: import("${interfacePath}").A;\na = {};`);
});
