import { Project } from 'ts-morph';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
import fs, { existsSync } from "fs";
import TypeHandler from "../../lib/code-refactor/types-refactor/type-handler/type-handler";
import {getTypeAliasType} from "../../lib/code-refactor/types-refactor/interface-handler/interface-creator/interface-creator";

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

test('should clean up union with identical interfaces', () => {
  const interfaceDeclaration = project.createSourceFile(
    'interfaces.ts',
    'interface A {}',
    {overwrite: true},
  ).getInterfaceOrThrow('A');
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()}
    | ${TypeHandler.getType(interfaceDeclaration).getText()}
    | ${TypeHandler.getType(interfaceDeclaration).getText()};`,
    {overwrite: true},
  );
  TypesRefactor.filterUnionType(sourceFile);
  expect(sourceFile.getText()).toEqual(`let a: ${TypeHandler.getType(interfaceDeclaration).getText()};`);
});

test('should clean up union with multiple types', () => {
  const interfaceDeclaration = project.createSourceFile(
    'interfaces.ts',
    'interface A {}',
    {overwrite: true},
  ).getInterfaceOrThrow('A');
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()} | ${TypeHandler.getType(interfaceDeclaration).getText()} | undefined;`,
    {overwrite: true},
  );
  TypesRefactor.filterUnionType(sourceFile);
  expect(sourceFile.getText()).toEqual(`let a: ${TypeHandler.getType(interfaceDeclaration).getText()} | undefined;`);
});

test('should remove undefined from optional parameter', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'function f (p?: string | undefined) {};',
    {overwrite: true},
  );
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.removeUndefinedFromOptional(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual('function f (p?: string) {};');
});

test('should remove null type', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a: null;',
    {overwrite: true},
  );
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.removeNullOrUndefinedTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`let a: ${typeAlias};`);
});

test('should remove nested null type', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'let a: null | undefined;',
    {overwrite: true},
  );
  const typeAlias = getTypeAliasType(project, '');
  TypesRefactor.removeNullOrUndefinedTypes(sourceFile, typeAlias);
  expect(sourceFile.getText()).toEqual(`let a: ${typeAlias};`);
});
