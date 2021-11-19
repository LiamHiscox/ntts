import {Project} from "ts-morph";
import {TypesRefactor} from "../../lib/code-refactor/types-refactor/types-refactor";

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

test('should define base types of literal assignments', () => {
  const sourceFile = project.createSourceFile(
    'simple-types.ts',
    'const a = 2;\n' +
    'const b = true;\n' +
    'const c = "text";\n',
    {overwrite: true}
  );
  TypesRefactor.declareInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual(
    'const a: number = 2;\n' +
    'const b: boolean = true;\n' +
    'const c: string = "text";\n'
  );
});

test('should not set type if it is any', () => {
  const sourceFile = project.createSourceFile('simple-types.ts', 'const a = asd();', {overwrite: true});
  TypesRefactor.declareInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual('const a = asd();');
});

const content =
  `class Car {
  mile;
  speed;
  private year;
  private month;
  static liam = "awd";

  constructor(year, month) {
    this.speed = 100;
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

const expectedContent = `
class Car {
  mile;
  speed;
  private year;
  private month;
  static liam = "awd";

  constructor(year, month) {
    this.speed = 100;
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

test('should type simple class', () => {
  const sourceFile = project.createSourceFile('standard-require.ts', content, {overwrite: true});
  TypesRefactor.declareInitialTypes(sourceFile);
  expect(sourceFile.getText()).toEqual(expectedContent);
});
