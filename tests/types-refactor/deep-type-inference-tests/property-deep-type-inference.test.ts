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

const liam = { liam: new Liam() };

dec(liam.liam);
arrow(liam.liam);
expr(liam.liam);

liam.liam.method(liam.liam);
liam.liam.prop(liam.liam);
liam.liam.expr(liam.liam);

obj.arrow(liam.liam);
obj.expr(liam.liam);
obj.method(liam.liam);`;

test('should set class type of parameter in same file with property assignment', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', _class + input, {overwrite: true});
  sourceFile
    .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
    .forEach(declaration => DeepTypeInference.propagateClassOrInterfaceType(declaration));
  expect(validate(sourceFile, "Liam")).toBeTruthy();
});

test('should set class type of parameter in separate file with property assignment', () => {
  const sourceFile1 = project.createSourceFile('class.ts', _class, {overwrite: true});
  const sourceFile2 = project.createSourceFile('usage.ts', 'import {Liam} from "./class";\n' + input, {overwrite: true});
  sourceFile2
    .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
    .forEach(declaration => DeepTypeInference.propagateClassOrInterfaceType(declaration));
  expect(validate(sourceFile1, "Liam")).toBeTruthy();
  expect(validate(sourceFile2, "Liam")).toBeTruthy();
});
