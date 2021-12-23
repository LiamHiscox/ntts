import { Project } from 'ts-morph';
import ClassRefactor from '../../lib/code-refactor/class-refactor/class-refactor';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

const content = `
class Car {
  #year;
  #month;
  static liam = "awd";

  constructor(speed, year, month) {
    this.speed = speed;
    this.mile = {current: 12};
    this.#year = year;
    this.#month = month;
    this.mile.current = 45;
  }

  get showYear () {
    return this.#year;
  }

  showDoubleYear () {
    return this.#doubleYear();
  }

  #doubleYear () {
    return this.#year * 2;
  }

  set #newYear (value) {
    this.#year = value;
  }

  static #tripleYear () {
    return 2021 * 3;
  }
}
`;

const expectedContent = `class Car {
    mile;
    speed;
  private year;
  private month;
  static liam = "awd";

  constructor(speed, year, month) {
    this.speed = speed;
    this.mile = {current: 12};
    this.year = year;
    this.month = month;
    this.mile.current = 45;
  }

  get showYear () {
    return this.year;
  }

  showDoubleYear () {
    return this.doubleYear();
  }

  private doubleYear () {
    return this.year * 2;
  }

  private set newYear (value) {
    this.year = value;
  }

  private static tripleYear () {
    return 2021 * 3;
  }
}
`;

test('should refactor simple class', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', content, { overwrite: true });
  ClassRefactor.toTypeScriptClasses(sourceFile);
  expect(sourceFile.getText()).toEqual(expectedContent);
});
