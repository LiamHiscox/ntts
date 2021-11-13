import {Project} from "ts-morph";
import {ImportsRefactor} from "../../lib/code-refactor/imports-refactor/imports-refactor";

const project = new Project();

test('should refactor imports with no default export', () => {
  project.createSourceFile('exports.ts', 'export const item = 12', {overwrite: true});
  const sourceFile2 = project.createSourceFile('imports.ts', 'import exports from "./exports";', {overwrite: true});
  ImportsRefactor.refactorImportClauses(sourceFile2);
  expect(sourceFile2.getText()).toEqual('import * as exports from "./exports";');
});

test('should refactor named imports with no matching named export', () => {
  project.createSourceFile('exports.ts', 'const item = 12; export { item };', {overwrite: true});
  const sourceFile2 = project.createSourceFile('imports.ts', 'import {item, missing} from "./exports";', {overwrite: true});
  ImportsRefactor.refactorImportClauses(sourceFile2);
  expect(sourceFile2.getText()).toEqual('import exports0, {item} from "./exports";\n\nconst { missing } = exports0;\n');
});

test('should refactor named imports with no matching named export and existing default import', () => {
  project.createSourceFile('exports.ts', 'const item = 12; export { item }; export default "asd"', {overwrite: true});
  const sourceFile2 = project.createSourceFile('imports.ts', 'import _exports, {item, missing} from "./exports";', {overwrite: true});
  ImportsRefactor.refactorImportClauses(sourceFile2);
  expect(sourceFile2.getText()).toEqual('import _exports, {item} from "./exports";\n\nconst { missing } = _exports;\n');
});

