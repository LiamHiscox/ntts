import {Project, SyntaxKind} from "ts-morph";
import {TypeInference} from "../../lib/code-refactor/types-refactor/type-inference/type-inference";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should set type of function parameters by usage', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'function fun (param1, param2) { return param1 + param2; };\nfun(12, "asd");', {overwrite: true});
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  TypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText()).toEqual('function fun (param1: number, param2: string) { return param1 + param2; };\nfun(12, "asd");');
});

test('should set function parameter as optional by usage', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'function fun (param1, param2) { return param1 + param2; };\nfun(12);\nfun(10, "asd");', {overwrite: true});
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  TypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText()).toEqual('function fun (param1: number, param2?: string) { return param1 + param2; };\nfun(12);\nfun(10, "asd");');
});

test('should set function parameter as union type by usage', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'function fun (param1) { return param1; };\nfun(12);\nfun("asd");\nfun(true);', {overwrite: true});
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  TypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText()).toEqual('function fun (param1: string | number | boolean) { return param1; };\nfun(12);\nfun("asd");\nfun(true);');
});

test('should not set function parameter as union type with duplicate type by usage', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'function fun (param1) { return param1; };\nfun(12);\nfun("asd");\nfun(1);', {overwrite: true});
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);
  TypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText()).toEqual('function fun (param1: string | number) { return param1; };\nfun(12);\nfun("asd");\nfun(1);');
});

test('should set type of variable declaration function parameters by usage', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'const fun = (param1, param2) => { return param1 + param2; };\nfun(12, "asd");', {overwrite: true});
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  TypeInference.inferFunctionAssignmentParameterTypes(_function);
  expect(sourceFile.getText()).toEqual('const fun = (param1: number, param2: string) => { return param1 + param2; };\nfun(12, "asd");');
});

test('should set type of class property assignment parameters by usage', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'class cls { fun = (param1, param2) => { return param1 + param2; }; }\nconst _cls = new cls();\n_cls.fun(12, "asd");', {overwrite: true});
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertyDeclaration);
  TypeInference.inferFunctionAssignmentParameterTypes(_function);
  expect(sourceFile.getText()).toEqual('class cls { fun = (param1: number, param2: string) => { return param1 + param2; }; }\nconst _cls = new cls();\n_cls.fun(12, "asd");');
});

test('should set type of class method parameters by usage', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'class cls { fun (param1, param2) { return param1 + param2; }; }\nconst _cls = new cls();\n_cls.fun(12, "asd");', {overwrite: true});
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);
  TypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText()).toEqual('class cls { fun (param1: number, param2: string) { return param1 + param2; }; }\nconst _cls = new cls();\n_cls.fun(12, "asd");');
});

test('should set type of class constructor parameters by usage', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'class cls { constructor (param1, param2) { return param1 + param2; }; }\nconst _cls = new cls(12, "asd");', {overwrite: true});
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Constructor);
  TypeInference.inferFunctionDeclarationParameterTypes(_function);
  expect(sourceFile.getText()).toEqual('class cls { constructor (param1: number, param2: string) { return param1 + param2; }; }\nconst _cls = new cls(12, "asd");');
});

test('should set type of property assignment parameters by usage', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'const prop = { fun: (param1, param2) => { return param1 + param2; } }\nprop.fun(12, "asd");', {overwrite: true});
  const _function = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertyAssignment);
  TypeInference.inferFunctionAssignmentParameterTypes(_function);
  expect(sourceFile.getText()).toEqual('const prop = { fun: (param1: number, param2: string) => { return param1 + param2; } }\nprop.fun(12, "asd");');
});
