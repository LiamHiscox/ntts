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
