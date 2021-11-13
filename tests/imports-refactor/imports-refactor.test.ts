import {Project} from "ts-morph";
import {ImportsRefactor} from "../../lib/code-refactor/imports-refactor/imports-refactor";

const project = new Project();

const content = `
const ts_morph = require("ts-morph");
const app = 12 + require("ts-morph");
const {item, name} = require("ts-morph");

console.log(item, name);
require("express")();
`;

const expectedContent =
`import ts_morph, { item, name } from "ts-morph";
import express from "express";

const app = 12 + ts_morph;
console.log(item, name);
express();
`;

test('should refactor multiple requires', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', content, {overwrite: true});
  ImportsRefactor.requiresToImports(sourceFile);
  expect(sourceFile.getText()).toEqual(expectedContent);
});
