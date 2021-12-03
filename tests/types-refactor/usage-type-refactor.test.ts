import {Project, SyntaxKind} from "ts-morph";
import {UsageTypeInference} from "../../lib/code-refactor/types-refactor/usage-type-inference/usage-type-inference";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should set type of object destructuring pattern', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let { a, b, c } = fun();\na=12;\nb=true', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let { a, b, c }: { a: number; b: boolean; c: any; } = fun();\na=12;\nb=true');
});

test('should set type of array destructuring pattern', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let [ a, b, c ] = fun();\na=12;\nb=true', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let [ a, b, c ]: [number, boolean, any] = fun();\na=12;\nb=true');
});

test('should set type of array destructuring pattern with nested object destructuring pattern', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let [ {a, d: [e, f]}, b, c ] = fun();\na=12;\nf=true;\nc=""', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let [ {a, d: [e, f]}, b, c ]: [{ a: number; d: [any, boolean]; }, any, string] = fun();\na=12;\nf=true;\nc=""');
});

test('should set type of simple variable', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let a = "asd";\na=12;\na=true', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let a: string | number | boolean = "asd";\na=12;\na=true');
});

test('should set type of object literal variable', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let a = {};\na = {b: "asd"};\na = {c: 12};', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let a: { b: string; c: number; } = {};\na = {b: "asd"};\na = {c: 12};');
});

test('should set type of object literal variable by property access', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let a = {};\na.b = "asd";\na.c = 12;', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let a: { b: string; c: number; } = {};\na.b = "asd";\na.c = 12;');
});

test('should set type of object literal variable by property access with initializer', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let a = {};\na.b = "asd";\na.c = 12;', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let a: { b: string; c: number; } = {};\na.b = "asd";\na.c = 12;');
});

test('should set type of object literal variable with destructuring operation', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let { a } = {};\na = "asd";\na = 12;', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let { a }: { a: string | number; } = {};\na = "asd";\na = 12;');
});

test('should set type of object literal variable by deep property access', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let a = someFun();\na.b.c = "asd";\na.c = 12;', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let a: { b: { c: string; }; c: number; } = someFun();\na.b.c = "asd";\na.c = 12;');
});

test('should set type of object literal variable by spread property access', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let { ...a }: { b: any; c: any; d: any; } = someFun();\na.b = "asd";\na.c = 12;', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let { ...a }: { b: string; c: number; d: any; } = someFun();\na.b = "asd";\na.c = 12;');
});

test('should set type of array variable', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let a = [1, 2, 3, 4];\na[0] = "asd";\na[1] = 12;', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let a: (string | number)[] = [1, 2, 3, 4];\na[0] = "asd";\na[1] = 12;');
});

test('should set type of array variable with property access', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let a = [];\na[0].b = "asd";\na[1].c = 12;', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let a: { b: string; c: number; }[] = [];\na[0].b = "asd";\na[1].c = 12;');
});

test('should set type of object literal variable by array spread access', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let [ ...a ] = [1, 2, 3, 4];', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let [ ...a ]: number[] = [1, 2, 3, 4];');
});

test('should not add property of prototype method', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let a = {};\na.hasOwnProperty("a");', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let a = {};\na.hasOwnProperty("a");');
});

test('should not add property of prototype method of array', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'let a = [];\na.map(() => {});', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('let a = [];\na.map(() => {});');
});
