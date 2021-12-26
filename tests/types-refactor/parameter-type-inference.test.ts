import { Project, SyntaxKind } from 'ts-morph';
import ParameterTypeInference from '../../lib/code-refactor/types-refactor/parameter-type-inference/parameter-type-inference';
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

test('should set type of function parameters by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (param1, param2) { return param1 + param2; };\nfun(12, "asd");',
    { overwrite: true },
  );
  const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(functionDeclaration);
  expect(sourceFile.getText())
    .toEqual('function fun (param1: number, param2: string) { return param1 + param2; };\nfun(12, "asd");');
});

test('should set function parameter as optional by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (param1, param2) { return param1 + param2; };\nfun(12);\nfun(10, "asd");',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('function fun (param1: number, param2?: string | undefined) { return param1 + param2; };\nfun(12);\nfun(10, "asd");');
});

test('should set function parameter as union type by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (param1) { return param1; };\nfun(12);\nfun("asd");\nfun(true);',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('function fun (param1: string | number | boolean) { return param1; };\nfun(12);\nfun("asd");\nfun(true);');
});

test('should not set function parameter as union type with duplicate type by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (param1) { return param1; };\nfun({qwe: 12});\nfun(({qwe: 11});\nfun(({qwe: 10});',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('function fun (param1: { qwe: number; }) { return param1; };\nfun({qwe: 12});\nfun(({qwe: 11});\nfun(({qwe: 10});');
});

test('should set type of variable declaration function parameters by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const fun = (param1, param2) => { return param1 + param2; };\nfun(12, "asd");',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  ParameterTypeInference.inferFunctionAssignmentParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('const fun = (param1: number, param2: string) => { return param1 + param2; };\nfun(12, "asd");');
});

test('should set type of variable declaration function expression parameters by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const fun = function (param1, param2) { return param1 + param2; };\nfun(12, "asd");',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  ParameterTypeInference.inferFunctionAssignmentParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('const fun = function (param1: number, param2: string) { return param1 + param2; };\nfun(12, "asd");');
});

test('should set type of class property assignment parameters by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'class cls { fun = (param1, param2) => { return param1 + param2; }; }\nconst _cls = new cls();\n_cls.fun(12, "asd");',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertyDeclaration);
  ParameterTypeInference.inferFunctionAssignmentParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('class cls { fun = (param1: number, param2: string) => { return param1 + param2; }; }\nconst _cls = new cls();\n_cls.fun(12, "asd");');
});

test('should set type of class method parameters by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'class cls { fun (param1, param2) { return param1 + param2; }; }\nconst _cls = new cls();\n_cls.fun(12, "asd");',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('class cls { fun (param1: number, param2: string) { return param1 + param2; }; }\nconst _cls = new cls();\n_cls.fun(12, "asd");');
});

test('should set type of class constructor parameters by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'class cls { constructor (param1, param2) { return param1 + param2; }; }\nconst _cls = new cls(12, "asd");',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Constructor);
  ParameterTypeInference.inferConstructorParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('class cls { constructor (param1: number, param2: string) { return param1 + param2; }; }\nconst _cls = new cls(12, "asd");');
});

test('should set type of property assignment parameters by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const prop = { fun: (param1, param2) => { return param1 + param2; } }\nprop.fun(12, "asd");',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertyAssignment);
  ParameterTypeInference.inferFunctionAssignmentParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('const prop = { fun: (param1: number, param2: string) => { return param1 + param2; } }\nprop.fun(12, "asd");');
});

test('should set type of function rest parameter by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (param1, ...param2) { return param1 + param2; };\nfun(12, "asd", "asd");',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('function fun (param1: number, ...param2: string[]) { return param1 + param2; };\nfun(12, "asd", "asd");');
});

test('should set type of function rest parameter by usage with union type', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (param1, ...param2: any[]) { return param1 + param2; };\nfun(12, "asd", 12);',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('function fun (param1: number, ...param2: (string | number)[]) { return param1 + param2; };\nfun(12, "asd", 12);');
});

test('should set type of function rest parameter by usage with set type', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (param1, ...param2: string[]) { return param1 + param2; };\nfun(12, "asd", 12);',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('function fun (param1: number, ...param2: string[] | (string | number)[]) { return param1 + param2; };\nfun(12, "asd", 12);');
});


test('should set union types of function rest parameter by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (param1, ...param2) { return param1 + param2; };\nfun(12, "asd", true, 12);',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('function fun (param1: number, ...param2: (string | number | boolean)[]) { return param1 + param2; };\nfun(12, "asd", true, 12);');
});

test('should set union types of function rest parameter by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun (param1, ...param2) { return param1 + param2; };\nfun(12, "asd", true, 12);',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('function fun (param1: number, ...param2: (string | number | boolean)[]) { return param1 + param2; };\nfun(12, "asd", true, 12);');
});

test('should set type of class setter method parameter by usage', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'class cls { set name (param1: any) { this.value = param1 }; }\nconst _cls = new cls();\n_cls.name = 12;',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SetAccessor);
  ParameterTypeInference.inferSetAccessorParameterTypes(_function);
  expect(sourceFile.getText())
    .toEqual('class cls { set name (param1: number) { this.value = param1 }; }\nconst _cls = new cls();\n_cls.name = 12;');
});

test('should not set type of wrong call expression format', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'function fun(value: any) { value + 12; }\nother(fun);',
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText()).toEqual('function fun(value: any) { value + 12; }\nother(fun);');
});

test('should parenthesise function property types', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    `
function fun (a) {}
fun ((resolve) => {})
fun ((resolve, reject) => { return 12; })`,
    { overwrite: true },
  );
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  ParameterTypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText()).toEqual(
    `function fun (a: (resolve: any, reject: any) => number | void) {}
fun ((resolve) => {})
fun ((resolve, reject) => { return 12; })`,
  );
});
