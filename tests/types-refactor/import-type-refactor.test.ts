import {Project, SyntaxKind} from "ts-morph";
import {TypeNodeRefactor} from "../../lib/code-refactor/types-refactor/type-node-refactor/type-node-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('refactor importType with named identifier as qualifier', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'let a: import("node_modules/@types/express-serve-static-core/index").Request;',
    {overwrite: true}
  );
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { Request } from "express-serve-static-core";\n\nlet a: Request;');
});

test('refactor importType with named qualified name as qualifier', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'let a: import("node_modules/@types/express-serve-static-core/index").Request.Collator;',
    {overwrite: true}
  );
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { Request } from "express-serve-static-core";\n\nlet a: Request.Collator;');
});

test('refactor importType with named identifier and type arguments as qualifier', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'let a: import("node_modules/@types/express-serve-static-core/index").Request<{}>;',
    {overwrite: true}
  );
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { Request } from "express-serve-static-core";\n\nlet a: Request<{}>;');
});

test('refactor importType with default identifier', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'let a: import("node_modules/@types/express-serve-static-core/index").default;',
    {overwrite: true}
  );
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import express_serve_static_core from "express-serve-static-core";\n\nlet a: express_serve_static_core;');
});

test('refactor importType with no identifier', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'let a: import("node_modules/@types/express-serve-static-core/index");',
    {overwrite: true}
  );
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import * as express_serve_static_core from "express-serve-static-core";\n\nlet a: express_serve_static_core;');
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
    {overwrite: true}
  );
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { WriteStream } from "fs";\n\nlet a: WriteStream;');
});

test('refactor importType with relative import path', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'let a: import("lib/index").Liam;',
    {overwrite: true}
  );
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { Liam } from "./lib/index";\n\nlet a: Liam;');
});

test('refactor importType with taken import name', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'import { Liam } from "./lib/liam";\nlet a: import("lib/index").Liam;',
    {overwrite: true}
  );
  TypeNodeRefactor.refactor(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile);
  expect(sourceFile.getText()).toEqual('import { Liam } from "./lib/liam";\nimport { Liam as Liam0 } from "./lib/index";\n\nlet a: Liam0;');
});

test('should refactor import type to import interface in neighbouring file', () => {
  const sourceFile1 = project.createSourceFile('temp/export-file.ts', '', {overwrite: true});
  const declaration = sourceFile1.addInterface({name: 'A', isExported: true});
  const sourceFile2 = project.createSourceFile('temp/import-file.ts', `let a: ${declaration.getType().getText()};`, {overwrite: true});
  project.saveSync();
  TypeNodeRefactor.refactor(sourceFile2.getFirstDescendantByKindOrThrow(SyntaxKind.ImportType), sourceFile2);
  expect(sourceFile2.getText()).toEqual(`import { A } from "./export-file";\n\nlet a: A;`);
});
