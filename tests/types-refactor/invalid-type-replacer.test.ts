import { Project } from 'ts-morph';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
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

test('should replace simple any and never types', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a: any, b: never);', { overwrite: true });
  TypesRefactor.replaceInvalidTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('function fun (a: unknown, b: unknown);');
});

test('should replace simple any and never types 2', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a: never | undefined);', { overwrite: true });
  TypesRefactor.replaceInvalidTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('function fun (a: unknown | undefined);');
});

test('should replace simple any and never types 3', () => {
  const sourceFile = project.createSourceFile('write-access.ts', 'function fun (a: never[]);', { overwrite: true });
  TypesRefactor.replaceInvalidTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('function fun (a: unknown[]);');
});
