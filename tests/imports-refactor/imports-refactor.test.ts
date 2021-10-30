import {Project} from "ts-morph";
import {CodeRefactor} from "../../lib/code-refactor/code-refactor";

const project = new Project();

const content = `
const ts_morph = require("ts-morph");
const app = 12 + require("ts-morph");
const ts_morph0 = require("ts-morph");

console.log(ts_morph0);
require("express")();
`;

const expectedContent =
`import ts_morph from "ts-morph";
import express from "express";

const app = 12 + ts_morph;
console.log(ts_morph);
express();
`;

test('should refactor multiple requires', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', content, {overwrite: true});
  CodeRefactor.convertToTypescript(sourceFile);
  expect(sourceFile.getText()).toEqual(expectedContent);
});
