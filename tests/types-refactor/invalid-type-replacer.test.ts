import { Project } from 'ts-morph';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
import fs, {existsSync} from "fs";
import {addTypeAlias, getTypeAliasType} from "../../lib/code-refactor/types-refactor/interface-handler/interface-creator/interface-creator";

let project: Project;

beforeEach(() => {
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
  addTypeAlias(project, '', false);
})

afterEach(() => {
  if (existsSync('ntts-generated-models.ts')) {
    fs.unlinkSync('ntts-generated-models.ts');
  }
})

test('should replace simple any and never types', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a: any, b: never);', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.replaceInvalidTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`function fun (a: ${typeAlias}, b: ${typeAlias});`);
});

test('should replace simple any and never types 2', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a: never | undefined);', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.replaceInvalidTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`function fun (a: ${typeAlias} | undefined);`);
});

test('should replace simple any and never types 3', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a: never[]);', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.replaceInvalidTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`function fun (a: ${typeAlias}[]);`);
});

test('should replace implicit any', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a);', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.replaceInvalidTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`function fun (a: ${typeAlias});`);
});

test('should replace unknown', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a: unknown);', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.replaceInvalidTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`function fun (a: ${typeAlias});`);
});

test('should replace unknown in function type', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: ((...args: any[]) => Q.Promise<unknown>) | undefined;', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.replaceInvalidTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`let a: ((...args: ${typeAlias}[]) => Q.Promise<${typeAlias}>) | undefined;`);
});

test('should replace unknown in function return', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun(): Promise<unknown> {}', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.replaceInvalidTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`function fun(): Promise<${typeAlias}> {}`);
});

test('should not replace invalid type in type alias', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'type $FixMe = any;', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.replaceInvalidTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`type $FixMe = any;`);
});

