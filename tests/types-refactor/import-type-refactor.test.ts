import {Project, SyntaxKind} from 'ts-morph';
import TypeNodeRefactor from '../../lib/code-refactor/types-refactor/type-node-refactor/type-node-refactor';
import fs, {existsSync} from 'fs';
import * as fse from 'fs-extra';

let project: Project;

beforeEach(() => {
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
})

afterEach(() => {
  if (existsSync('ntts-generated-models.ts')) {
    fs.unlinkSync('ntts-generated-models.ts');
  }
  if (existsSync('temp')) {
    fse.rmSync('temp', { recursive: true, force: true });
  }
})

test('refactor importType with named identifier as qualifier', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', '', {overwrite: true});
  sourceFile.replaceWithText(`let a: import("${sourceFile.getDirectoryPath()}/node_modules/@types/express-serve-static-core/index").Request;`);
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { Request } from "express-serve-static-core";\n\nlet a: Request;');
});

test('refactor importType with named qualified name as qualifier', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', '', {overwrite: true});
  sourceFile.replaceWithText(`let a: import("${sourceFile.getDirectoryPath()}/node_modules/@types/express-serve-static-core/index").Request.Collator;`);
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { Request } from "express-serve-static-core";\n\nlet a: Request.Collator;');
});

test('refactor importType with named identifier and type arguments as qualifier', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', '', {overwrite: true});
  sourceFile.replaceWithText(`let a: import("${sourceFile.getDirectoryPath()}/node_modules/@types/express-serve-static-core/index").Request<{}>;`);
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { Request } from "express-serve-static-core";\n\nlet a: Request<{}>;');
});

test('refactor importType with default identifier', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', '', {overwrite: true});
  sourceFile.replaceWithText(`let a: import("${sourceFile.getDirectoryPath()}/node_modules/@types/express-serve-static-core/index").default;`);
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import express_serve_static_core from "express-serve-static-core";\n\nlet a: express_serve_static_core;');
});

test('refactor importType with no identifier', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', '', {overwrite: true});
  sourceFile.replaceWithText(`let a: import("${sourceFile.getDirectoryPath()}/node_modules/@types/express-serve-static-core/index");`);
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText())
    .toEqual('import * as express_serve_static_core from "express-serve-static-core";\n\nlet a: express_serve_static_core;');
});

test('refactor importType with node import path', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'let a: import("path").ParsedPath;',
    {overwrite: true}
  );
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { ParsedPath } from "path";\n\nlet a: ParsedPath;');
});

test('refactor importType with fs node import path', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'let a: import("fs").WriteStream;',
    {overwrite: true},
  );
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { WriteStream } from "fs";\n\nlet a: WriteStream;');
});

test('should refactor import type to import interface in neighbouring file', () => {
  const sourceFile1 = project.createSourceFile('temp/export-file.ts', '', {overwrite: true});
  const declaration = sourceFile1.addInterface({name: 'A', isExported: true});
  const sourceFile2 = project.createSourceFile('temp/import-file.ts', `let a: ${declaration.getType().getText()};`, {overwrite: true});
  project.saveSync();
  TypeNodeRefactor.refactor(sourceFile2.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile2);
  expect(sourceFile2.getText()).toEqual('import { A } from "./export-file";\n\nlet a: A;');
});
