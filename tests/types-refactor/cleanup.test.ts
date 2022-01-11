import { Project } from 'ts-morph';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
import fs, { existsSync } from "fs";

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
    `let a: ${interfaceDeclaration.getType().getText()} | ${interfaceDeclaration.getType().getText()} | ${interfaceDeclaration.getType().getText()};`,
    {overwrite: true},
  );
  TypesRefactor.filterUnionType(sourceFile);
  expect(sourceFile.getText()).toEqual(`let a: ${interfaceDeclaration.getType().getText()};`);
});

test('should clean up union with multiple types', () => {
  const interfaceDeclaration = project.createSourceFile(
    'interfaces.ts',
    'interface A {}',
    {overwrite: true},
  ).getInterfaceOrThrow('A');
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${interfaceDeclaration.getType().getText()} | ${interfaceDeclaration.getType().getText()} | undefined;`,
    {overwrite: true},
  );
  TypesRefactor.filterUnionType(sourceFile);
  expect(sourceFile.getText()).toEqual(`let a: ${interfaceDeclaration.getType().getText()} | undefined;`);
});

test('should remove undefined from optional parameter', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'function f (p?: string | undefined) {};',
    {overwrite: true},
  );
  TypesRefactor.removeUndefinedFromOptional(sourceFile);
  expect(sourceFile.getText()).toEqual('function f (p?: string) {};');
});
