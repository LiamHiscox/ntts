import {Project, SyntaxKind} from "ts-morph";
import {DeepTypeInference} from "../../../lib/code-refactor/types-refactor/deep-type-inference/deep-type-inference";
import {validate} from "./helper-function";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

const _class = `
export class Liam {
  prop = (asd) => {}
  expr = function (asd) {}
  method (asd) {}
}`;

const input = `
function dec (asd) {}
const arrow = (asd) => {}
const expr = function (asd) {}

const obj = {
  arrow: (asd) => {},
  expr: function (asd) {},
  method(asd) {}
}

const liam = new Liam();

dec(liam);
arrow(liam);
expr(liam);

liam.method(liam);
liam.prop(liam);
liam.expr(liam);

obj.arrow(liam);
obj.expr(liam);
obj.method(liam);`;

test('should set class type of parameter in same file', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', _class + input, {overwrite: true});
  sourceFile
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .forEach(declaration => DeepTypeInference.propagateClassOrInterfaceType(declaration));
  expect(validate(sourceFile, "Liam")).toBeTruthy();
});

test('should set class type of parameter in separate file', () => {
  const sourceFile1 = project.createSourceFile('class.ts', _class, {overwrite: true});
  const sourceFile2 = project.createSourceFile('usage.ts', 'import {Liam} from "./class";\n' + input, {overwrite: true});
  sourceFile2
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .forEach(declaration => DeepTypeInference.propagateClassOrInterfaceType(declaration));
  expect(validate(sourceFile1, "Liam")).toBeTruthy();
  expect(validate(sourceFile2, "Liam")).toBeTruthy();
});

const input2 = `
export class Liam {}
export class Car {
  constructor(asd) {}
}
const l = new Liam();
const c = new Car(l);
`;

test('should set class type of constructor parameter', () => {
  const sourceFile = project.createSourceFile('usage.ts', input2, {overwrite: true});
  sourceFile
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .forEach(declaration => DeepTypeInference.propagateClassOrInterfaceType(declaration));
  expect(validate(sourceFile, "Liam")).toBeTruthy();
});
