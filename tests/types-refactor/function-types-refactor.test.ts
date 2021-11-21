import {Project} from "ts-morph";
import {TypesRefactor} from "../../lib/code-refactor/types-refactor/types-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should set types of arrow function', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const a = (cb: (route: string) => void): void => cb("abc");\na(qwe => console.log(qwe));',
    {overwrite: true}
  );
  TypesRefactor.declareInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('const a = (cb: (route: string) => void): void => cb("abc");\na((qwe: string): void => console.log(qwe));');
});

test('should set types of arrow function with array binding pattern', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const c = ([a, b]) => a * b;',
    {overwrite: true}
  );
  TypesRefactor.declareInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('const c = ([a, b]: [any, any]): number => a * b;');
});

