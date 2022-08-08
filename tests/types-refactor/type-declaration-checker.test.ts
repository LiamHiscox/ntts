import { Project } from 'ts-morph';
import * as fs from "fs";
import TypesRefactor from "../../lib/code-refactor/types-refactor/types-refactor";

let project: Project;

beforeEach(() => {
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
})

afterEach(() => {
  if (fs.existsSync('ntts-generated-models.ts')) {
    fs.unlinkSync('ntts-generated-models.ts');
  }
})

test('should remove type node from variable declaration', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (a: number) { return a; };\nconst a: number = fun(12);',
    { overwrite: true },
  );
  TypesRefactor.removeUnnecessaryTypeNodes(sourceFile);
  expect(sourceFile.getText())
    .toEqual('function fun (a: number) { return a; };\nconst a = fun(12);');
});

test('should remove type node from function return', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (a: number): number { return a; };',
    { overwrite: true },
  );
  TypesRefactor.removeUnnecessaryTypeNodes(sourceFile);
  expect(sourceFile.getText())
    .toEqual('function fun (a: number) { return a; };');
});

test('should not remove type from type alias', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'type $FixMe = any;',
    { overwrite: true },
  );
  TypesRefactor.removeUnnecessaryTypeNodes(sourceFile);
  expect(sourceFile.getText())
    .toEqual('type $FixMe = any;');
});
