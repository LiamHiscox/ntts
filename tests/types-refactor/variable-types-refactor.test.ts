import {Project} from "ts-morph";
import {TypesRefactor} from "../../lib/code-refactor/types-refactor/types-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should define base types of literal assignments', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const a = 2;\n' +
    'const b = true;\n' +
    'const c = "text";\n',
    {overwrite: true}
  );
  TypesRefactor.setInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual(
    'const a: number = 2;\n' +
    'const b: boolean = true;\n' +
    'const c: string = "text";\n'
  );
});

test('should not set type if it is any', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'const a = asd();', {overwrite: true});
  TypesRefactor.setInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('const a = asd();');
});

test('should type array binding pattern', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'const [a, b] = [1, 2];', {overwrite: true});
  TypesRefactor.setInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('const [a, b]: [number, number] = [1, 2];');
});

test('should type object binding pattern', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'const {a, b} = {a: 1, b: 2};', {overwrite: true});
  TypesRefactor.setInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('const {a, b}: { a: number; b: number; } = {a: 1, b: 2};');
});
