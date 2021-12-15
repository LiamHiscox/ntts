import {Project} from "ts-morph";
import {TypesRefactor} from "../../lib/code-refactor/types-refactor/types-refactor";
import {TypeSimplifier} from "../../lib/code-refactor/types-refactor/helpers/type-simplifier/type-simplifier";
import {TypeHandler} from "../../lib/code-refactor/types-refactor/type-handler/type-handler";

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
  TypesRefactor.setInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('const a = (cb: (route: string) => void): void => cb("abc");\na((qwe: string): void => console.log(qwe));');
});

test('should set types of arrow function with array binding pattern', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const c = ([a, b]) => a * b;',
    {overwrite: true}
  );
  TypesRefactor.setInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('const c = ([a, b]: [any, any]): number => a * b;');
});

test('simplify function union type node', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const cb: ((resolve: any, reject: any) => Promise<void>) | ((resolve: any, _: any) => Promise<void>) | ((resolve: any) => NodeJS.Timeout) | ((_: any, reject: any) => any) | ((resolve: any) => NodeJS.Timeout);',
    {overwrite: true}
  );
  const declaration = sourceFile.getVariableDeclarationOrThrow('cb');
  const simplified = TypeSimplifier.simplifyTypeNode(declaration.getTypeNodeOrThrow());
  simplified && TypeHandler.setTypeFiltered(declaration, simplified);
  expect(sourceFile.getText()).toEqual('const cb: (resolve: any, reject?: any) => Promise<void> | NodeJS.Timeout;');
});
