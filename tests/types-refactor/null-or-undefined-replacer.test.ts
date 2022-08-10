import {Project} from 'ts-morph';
import fs, {existsSync} from 'fs';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
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

test('should replace simple null and undefined types', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a: null, b: undefined);', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.removeNullOrUndefinedTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`function fun (a: ${typeAlias}, b: ${typeAlias});`);
});

test('should replace union types', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a: null | undefined, b: undefined | null);', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.removeNullOrUndefinedTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`function fun (a: ${typeAlias}, b: ${typeAlias});`);
});

test('should replace union type in variable declaration', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'let a: null | undefined;', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.removeNullOrUndefinedTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`let a: ${typeAlias};`);
});

test('should not replace union types', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a: null | string, b: undefined | number);', { overwrite: true });
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.removeNullOrUndefinedTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual('function fun (a: null | string, b: undefined | number);');
});

