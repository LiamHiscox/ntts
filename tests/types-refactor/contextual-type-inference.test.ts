import { Project, SyntaxKind } from 'ts-morph';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
import fs, {existsSync} from "fs";
import {getInterfaces} from "../../lib/code-refactor/types-refactor/interface-handler/interface-creator/interface-creator";
import flatten from "./helpers";
import TypeHandler from "../../lib/code-refactor/types-refactor/type-handler/type-handler";

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

test('should set type of variable by contextual type', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'import path from "path";\nconst a = fun();\npath.join(a);',
    { overwrite: true },
  );
  sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  TypesRefactor.inferContextualType(sourceFile, project, '');
  expect(sourceFile.getText()).toEqual('import path from "path";\nconst a: string = fun();\npath.join(a);');
});

test('should set type of variable by contextual type and generate interface', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'const f = (p: { a: number; } | { b: string; }) => ({a: 12});\nconst a = fun();\nf(a);',
    { overwrite: true },
  );
  sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  TypesRefactor.inferContextualType(sourceFile, project, '');
  const A = getInterfaces(project, '').find(i => i.getName() === 'A');
  expect(A).not.toBeUndefined();
  if (A) {
    expect(flatten(A)).toEqual('export interface A { a?: number; b?: string; }');
    expect(sourceFile.getText())
      .toEqual(`const f = (p: { a: number; } | { b: string; }) => ({a: 12});\nconst a: ${TypeHandler.getType(A).getText()} = fun();\nf(a);`);
  }
});

test('should set type of variable by contextual type with union type', () => {
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    'function b(b: number | string | boolean);\nconst a = "asd";\nb(a);',
    { overwrite: true },
  );
  sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  TypesRefactor.inferContextualType(sourceFile, project, '');
  expect(sourceFile.getText()).toEqual('function b(b: number | string | boolean);\nconst a = "asd";\nb(a);');
});
