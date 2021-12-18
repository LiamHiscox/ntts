import {Project, Node} from "ts-morph";
import {getSourceFile} from "../../lib/code-refactor/types-refactor/interface-handler/interface-creator/interface-creator";
import {TypesRefactor} from "../../lib/code-refactor/types-refactor/types-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

const flatten = (node: Node) => node.getText().replace(/\s+/g, ' ');

test('should add properties to interface from array property access', () => {
  const interfaceDeclaration = getSourceFile(project).addInterface({name: "Empty", isExported: true});
  const sourceFile = project.createSourceFile('write-access.ts', `let a: ${interfaceDeclaration.getType().getText()}[] = [{}];\na[0].b = "asd";\na[0].c = 12;`, {overwrite: true});
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project);
  TypesRefactor.checkInterfaceProperties(project);
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { b?: string | undefined; c?: number | undefined; }');
});

test('should not add properties to interface when they already exist in array', () => {
  const interfaceDeclaration = getSourceFile(project).addInterface({name: "Empty", properties: [{name: "a", type: "string"}, {name: "b", type: "number"}], isExported: true});
  const sourceFile = project.createSourceFile('write-access.ts', `let a: ${interfaceDeclaration.getType().getText()}[] = [{}];\na[0].a = false;\na[0]['b'] = false;`, {overwrite: true});
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project);
  TypesRefactor.checkInterfaceProperties(project);
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { a: string | boolean; b: number | boolean; }');
});

test('should add properties to interface from array element access', () => {
  const interfaceDeclaration = getSourceFile(project).addInterface({name: "Empty", isExported: true});
  const sourceFile = project.createSourceFile('write-access.ts', `let a: ${interfaceDeclaration.getType().getText()}[] = [{}];\na[0]['b'] = "asd";\na[0][0] = 12\na[0][2+2] = true;`, {overwrite: true});
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project);
  TypesRefactor.checkInterfaceProperties(project);
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { b?: string | undefined; 0?: number | undefined; [key: number]: boolean; }');
});

test('should not add property of array prototype method', () => {
  const interfaceDeclaration = getSourceFile(project).addInterface({name: "Empty", isExported: true});
  const sourceFile = project.createSourceFile('write-access.ts', `let a: ${interfaceDeclaration.getType().getText()}[] = [{}];\na[0].hasOwnProperty("a");`, {overwrite: true});
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project);
  TypesRefactor.checkInterfaceProperties(project);
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { }');
});

test('should add index signature in array', () => {
  const interfaceDeclaration = getSourceFile(project).addInterface({name: "Empty", isExported: true});
  const sourceFile = project.createSourceFile('write-access.ts', `const a: ${interfaceDeclaration.getType().getText()}[] = [{}];\nconst b = "asd";\na[0][b] = 12;`, {overwrite: true});
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project);
  TypesRefactor.checkInterfaceProperties(project);
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { [key: string]: number; }');
});

test('should add properties to two interfaces from property access in union type in array', () => {
  const interfaceA = getSourceFile(project).addInterface({name: "A", isExported: true});
  const interfaceB = getSourceFile(project).addInterface({name: "B", isExported: true});
  const sourceFile = project.createSourceFile('write-access.ts', `let a: (${interfaceA.getType().getText()} | ${interfaceB.getType().getText()})[] = [{}];\na[0].b = "asd";\na[0].c = 12;`, {overwrite: true});
  TypesRefactor.addPropertiesFromUsageOfInterface(sourceFile, project);
  TypesRefactor.checkInterfaceProperties(project);
  expect(flatten(interfaceA)).toEqual('export interface A { b?: string | undefined; c?: number | undefined; }');
  expect(flatten(interfaceB)).toEqual('export interface B { b?: string | undefined; c?: number | undefined; }');
});
