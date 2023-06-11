# ntts
A CLI tool for refactoring an existing Node.js application to a fully functional TypeScript application.

# Functionality
Refactoring a NodeJS application all at once is a very time-consuming process when done by hand.
Because of this, the goal of this tool is to automate this process to reduce the time needed.
Furthermore, since the TypeScript compiler is not able to infer the types of parameters by the values passed, they default to `any`.
Declaring these types by hand and declaring interfaces where apropiate is time-consuming and repetitive.
This tool refactors an existing Node.js application to support TypeScript. This process is split up into several different steps:
- Linting the project before refactoring
- Configuring TypeScript according to the installed Node.js version
- Installing additional dependencies such as TypeScript, TS-Node and type declarations for Node.js
- Installing type declarations for untyped dependencies
- Renaming files from JavaScript to TypeScript
- Refactoring scripts inside the package.json to target TypeScript files and use TS-Node instead
- Refactoring JavaScript code to valid TypeScript code
  - Refactoring CommonJS imports and exports to use the ES module syntax
  - Refactoring classes to declare properties inside the body before being accessed
- Inferring types of variables, parameters and properties by analyzing their usage

# Example
The main issue when refactoring JavaScript to TypeScript is the missing type information for parameters.
Since the TypeScript is not able to infer the types of parameters by the values passed, they default to `any`.
Declaring these types by hand can be a very time-consuming process, which can be automated to a large degree.
This tool aims to reduce the time needed to refactor an existing NodeJS application.
Consider the following JavaScript code:

````
class Person {
  #age;
  constructor (age, name) {
    this.#age = age;
    this.name = name;
  }	
}

module.exports.Person = Person;
````
````
const { Person } = require("./person");

const person = new Person(45);
````
First, the tool refactors all CommonJS imports and exports to use the ES Module syntax instead.
Next, All classes are refactored to use the correct keywords and declare all properties inside the body before being accessed.
Lastly, types of parameters, variables and properties have their types inferred by analyzing their usage inside the code.
Since the `constructor` of the class `Person` is called once, its parameter's types can be inferred by analyzing the values passed.

The resulting TypeScript code looks as follows:
````
import { $FixMe } from "./ntts-generated-models";

class Person {
  name;
  private age;

  constructor (age: number, name?: $FixMe) {
    this.age = age;
    this.name = name;
  }	
}

export { Person };
````
````
import { Person } from "./person";

const person = new Person(45);
````
````
export type $FixMe = any;
````

To allow for a better refactoring experience, variables, parameters and properties which cannot have their types inferred by the refactoring tool
have their types explicitly set to `$FixMe`, which is a type alias of type `any`.
This enables developers to more easily search for and replace undefined types inside the application.
Furthermore, this type alias is placed inside a generated file named `ntts-generated-models.ts`, which also contains all generated interfaces.

# Installation
It is recommended to install the package globally as follows:
`npm i -g ntts`

# Setup
In order to correctly refactor a Node.js application, first navigate to the root folder the project, which contains the package.json file.
If specific JavaScript files or whole directories are supposed to be ignored during the refactoring process, please provide an ignore file of the name `.nttsignore`.
This uses the same syntax as a `.gitignore` file. If no `.nttsignore` file is provided, the tool falls back on the `.gitignore` file, if one exists.

# Refactoring a project
Many of the refactoring steps listed above can be skipped by using the appropriate flag.
Additionally, a target folder can be provided to define the directory to refactor the JavaScript code in.
Values which implicitly are of type `any`, `unknown` or `never` have it defined as `any` by default, using the following type alias: `type $FixMe = any`.
If preferred, the type alias can also be of type `unknown` by using the appropriate flag.
To refactor a project run the following command:

`ntts refactor`

If only a specific directory should be refactored, stay inside the root of the project and provide the target path by using the `-t` or `--target` flag as follows:

`ntts refactor -t ./src/backend`

Additionally, if the generated type alias should be of type `unknown` instead of `any` use the `-u` or `--unknown` flag as follows:

`ntts refactor -u`

The generated type alias will then look as follows:

`type $FixMe = unknown;`

All setup tasks can be skipped by providing the appropriate flags. The get an overview of all the available options, please run the following command:

`ntts refactor --help`

The output returned is the following:

```
ntts refactor                                                                   
                                                                                
refactor an existing Node.js application to support TypeScript                  
                                                                                
Options:                                                                        
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
  -t, --target        Provide the target folder to refactor the files in
                                                         [string] [default: "."]
  -u, --unknown       Use the type unknown instead of any to explicitly type
                      untyped values                  [boolean] [default: false]
  -i, --installation  Skip the creation of a package.json (if none is present)
                      and installation of dependencies (npm install)
                                                      [boolean] [default: false]
  -l, --lint          Skip the linting process performed with ES-Lint
                                                      [boolean] [default: false]
  -c, --config        Skip the addition of a tsconfig.json file and the
                      configuration of TypeScript     [boolean] [default: false]
  -d, --dependencies  Skip the installation of additional dependencies such as
                      TypeScript, TS-Node and type declarations
                                                      [boolean] [default: false]
  -r, --rename        Skip the renaming of JavaScript files to TypeScript files
                      inside the target path          [boolean] [default: false]
  -s, --scripts       Skip the refactoring of scripts inside the package.json
                      file to use TS-Node and target TypeScript files
                                                      [boolean] [default: false]
```

# Additional Information
Please be aware that the tool is still being improved on and is not in its final state.
Additionally, the performance may vary depending on the size of the project and the complexity of its code.
Since it was only tested on Node.js applications, it is not guaranteed to produce the desired results on frontend applications.
