import {Project} from "ts-morph";
import {TypesRefactor} from "../../lib/code-refactor/types-refactor/types-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should replace simple any and never types', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: any;\nlet b: never;', {overwrite: true});
  TypesRefactor.replaceInvalidTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('let a: unknown;\nlet b: unknown;');
});

test('should replace type in union', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: never | undefined;', {overwrite: true});
  TypesRefactor.replaceInvalidTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('let a: unknown | undefined;');
});

test('should replace array element type', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: never[];', {overwrite: true});
  TypesRefactor.replaceInvalidTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('let a: unknown[];');
});

test('should replace array element type in union', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: any[] | never[];', {overwrite: true});
  TypesRefactor.replaceInvalidTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('let a: unknown[] | unknown[];');
});
