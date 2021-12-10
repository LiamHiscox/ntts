import {Project, SyntaxKind} from "ts-morph";
import {UsageTypeInference} from "../../lib/code-refactor/types-refactor/usage-type-inference/usage-type-inference";
import {ClassRefactor} from "../../lib/code-refactor/class-refactor/class-refactor";
import {ExportsRefactor} from "../../lib/code-refactor/exports-refactor/exports-refactor";
import {ImportsRefactor} from "../../lib/code-refactor/imports-refactor/imports-refactor";
import {TypesRefactor} from "../../lib/code-refactor/types-refactor/types-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should set type of property in class', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'class a { name; initName() { this.name = "liam"; } }', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertyDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('class a { name: string; initName() { this.name = "liam"; } }');
});

test('should set not type of property declared in constructor in class', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'class a { name = ""; initName() { this.name = "liam"; } }', {overwrite: true});
  const declaration = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertyDeclaration);
  UsageTypeInference.inferDeclarationType(declaration);
  expect(sourceFile.getText()).toEqual('class a { name = ""; initName() { this.name = "liam"; } }');
});

test('should set not type of property initialized in constructor in class', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'class A extends Error { name; constructor(message) { this.name = message; } };\nnew A("qwe");', {overwrite: true});
  TypesRefactor.inferUsageTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('class A extends Error { name; constructor(message: string) { this.name = message; } };\nnew A("qwe");');
});

const file1 = `
class SocketDisconnectedError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

module.exports = SocketDisconnectedError;
`

const file2 = `
const SocketDisconnectedError = require('./socketDisconnectedError');
new SocketDisconnectedError("Socket is disconnected");
`
test('failing code in webui', () => {
  const sourceFile1 = project.createSourceFile('socketDisconnectedError.ts', file1, {overwrite: true});
  const sourceFile2 = project.createSourceFile('class-usage.ts', file2, {overwrite: true});
  ClassRefactor.toTypeScriptClasses(sourceFile1);
  ClassRefactor.toTypeScriptClasses(sourceFile2);
  ExportsRefactor.moduleExportsToExport(sourceFile1);
  ExportsRefactor.moduleExportsToExport(sourceFile2);
  ImportsRefactor.requiresToImports(sourceFile2);
  TypesRefactor.inferUsageTypes(sourceFile1);
  TypesRefactor.inferUsageTypes(sourceFile2);

  expect(sourceFile1.getText()).toEqual('')
  expect(sourceFile2.getText()).toEqual('')
})
