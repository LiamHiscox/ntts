import {Project} from 'ts-morph';
import {existsSync, unlinkSync} from 'fs';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
import {getSourceFile} from '../../lib/code-refactor/types-refactor/interface-handler/interface-creator/interface-creator';
import flatten from './helpers';
import TypeHandler from '../../lib/code-refactor/types-refactor/type-handler/type-handler';

let project: Project;

beforeEach(() => {
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
})

afterEach(() => {
  if (existsSync('ntts-generated-models.ts')) {
    unlinkSync('ntts-generated-models.ts');
  }
})

test('should set return type of function declaration as interface', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun() { return { name: "mike", age: 45 }; }',
    {overwrite: true},
  );
  TypesRefactor.setFunctionReturnTypes(sourceFile, project, '');
  const generatedFile = getSourceFile(project, '');
  const interfaceDeclaration = generatedFile.getInterface((i) => i.getName() === 'Fun');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Fun { name: string; age: number; }');
  expect(interfaceDeclaration).not.toBeUndefined();
  if (interfaceDeclaration) {
    expect(sourceFile.getText())
      .toEqual(`function fun(): ${TypeHandler.getType(interfaceDeclaration).getText()} { return { name: "mike", age: 45 }; }`);
  }
});

test('should set return type of function declaration as interface', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'interface A {};\nfunction fun(a: A) { return a; }',
    { overwrite: true },
  );
  expect(sourceFile.getText())
    .toEqual('interface A {};\nfunction fun(a: A) { return a; }');
});

test('should set return type of arrow function as interface', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const fun = () => { return { name: "mike", age: 45 }; }',
    { overwrite: true },
  );
  TypesRefactor.setFunctionReturnTypes(sourceFile, project, '');
  const generatedFile = getSourceFile(project, '');
  const interfaceDeclaration = generatedFile.getInterface((i) => i.getName() === 'Fun');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Fun { name: string; age: number; }');
  expect(interfaceDeclaration).not.toBeUndefined();
  if (interfaceDeclaration) {
    expect(sourceFile.getText())
      .toEqual(`const fun = (): ${TypeHandler.getType(interfaceDeclaration).getText()} => { return { name: "mike", age: 45 }; }`);
  }
});
