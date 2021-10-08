import {existsSync, readFileSync, writeFileSync} from "fs";
import {PackageJsonModel, Scripts} from "../models/package-json.model";
import {resolve} from "path";
import {Logger} from "../logger/logger";
import {FileRename} from "../file-rename/file-rename";

interface NodeCliModel {
  preNodeArguments: string[];
  node: boolean;
  options: string[];
  scriptFile?: string;
  arguments: string[];
}

export class PackageJsonHandler {
  private static isNodeScript = (script: string): boolean => {
    return /^(.*? +)?node(?! +inspect)(\s+-.*?)* [^\-\s].*$/.test(script);
  }

  private static parseNodeScript = (script: string): NodeCliModel => {
    return script
      .replace(/\s+/g, ' ')
      .split(' ')
      .reduce((acc: NodeCliModel, parameter: string) => {
        if (!acc.node && parameter !== 'node') {
          return {...acc, preNodeArguments: [...acc.preNodeArguments, parameter]};
        } if (!acc.node && parameter === 'node') {
          return {...acc, node: true};
        } if (!acc.scriptFile && parameter.startsWith('-')) {
          return {...acc, options: [...acc.options, parameter]};
        } if (!acc.scriptFile) {
          return {...acc, scriptFile: FileRename.renameFileName(parameter)};
        }
        return {...acc, arguments: [...acc.arguments, parameter]};
      }, {preNodeArguments: [], node: false, options: [], arguments: []});
  }

  private static fileInTargetPath = (path: string, file?: string): boolean => {
    return !!file && resolve(file).startsWith(resolve(path));
  }

  private static transformNodeScript = (script: string, path: string): string => {
    const trimmed = script.trim();
    if (!this.isNodeScript(trimmed)) {
      return trimmed;
    }
    const parsedScript = this.parseNodeScript(trimmed);
    if (this.fileInTargetPath(path, parsedScript.scriptFile)) {
      return (`${parsedScript.preNodeArguments.join(' ')} ts-node ${parsedScript.scriptFile} ${parsedScript.arguments.join(' ')}`).trim();
    }
    return trimmed;
  }

  private static splitScript = (script: string): string[] => {
    return script.split(' && ').reduce((acc, s) => acc.concat(s.split(' & ')), new Array<string>());
  }

  private static joinScripts = (scripts: string[], connectors: RegExpMatchArray | null) => {
    return scripts.reduce((acc, s, index) => {
      if (index == 0) {
        return s;
      }
      return acc + (connectors ? connectors[index-1] : ' && ') + s;
    }, '');
  }

  private static uniqueName = (scripts: Scripts, name: string, counter: number): string => {
    const newName = `${name}-${counter}`;
    if (scripts.hasOwnProperty(newName)) {
      return this.uniqueName(scripts, name, ++counter);
    }
    return newName;
  }

  private static addTscScriptName = (scripts: Scripts, name: string, script: string): Scripts => {
    if (scripts.hasOwnProperty(name)) {
      const newName = this.uniqueName(scripts, name, 1);
      return {...scripts, [newName]: script};
    }
    return {...scripts, [name]: script};
  }

  private static tsconfigFileName = () => {
    return existsSync('tsconfig.ntts.json') ? 'tsconfig.ntts.json' : 'tsconfig.json';
  }

  /**
   * @param packageJson the package.json content to change the main target in
   * @param target the target path to do the refactoring in
   */
  static changeMainFile = (packageJson: PackageJsonModel, target: string): PackageJsonModel => {
    if (packageJson.main && this.fileInTargetPath(target, packageJson.main)) {
      return {...packageJson, "main": FileRename.renameFileName(packageJson.main)};
    }
    return packageJson;
  }

  /**
   * @param scripts the existing scripts in the package.json
   * @param path the target path to do the refactoring in
   * @returns Scripts the node scripts refactored to support ts-node
   */
  static addTsScripts = (scripts: Scripts, path: string): Scripts => {
    const tsconfig = this.tsconfigFileName();
    const watchScripts = this.addTscScriptName(scripts, 'tsc-watch', `tsc -w -p ${tsconfig}`);
    const fullScripts = this.addTscScriptName(watchScripts, 'tsc-build', `tsc -p ${tsconfig}`);
    return Object
      .entries(fullScripts)
      .reduce((acc: Scripts, [name, script]: [string, string]) => {
        const connectors = script.match(/ +[&]{1,2} +/g);
        const transformed = this.splitScript(script).map(s => this.transformNodeScript(s, path));
        const result = this.joinScripts(transformed, connectors);
        return {...acc, [name]: result};
      }, {});
  }

  /**
   * @returns PackageJsonHandler the parsed contents of the root package.json
   */
  static readPackageJson = (): PackageJsonModel => {
    const packageJson = JSON.parse(readFileSync('package.json', {encoding: 'utf-8'}));
    if (!packageJson.hasOwnProperty('scripts')) {
      return {...packageJson, scripts: {}} as PackageJsonModel;
    }
    return packageJson as PackageJsonModel;
  }

  /**
   * @param packageJson writes to the root package.json
   */
  static writePackageJson = (packageJson: PackageJsonModel) => {
    writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  }

  /**
   * @param target the target folder to refactor the files in
   * @description refactors the all node scripts in the package.json that point to a file inside the target folder
   */
  static refactorScripts = (target: string) => {
    Logger.info('Adding new scripts to package.json');
    const packageJson = this.changeMainFile(PackageJsonHandler.readPackageJson(), target);
    const scripts = PackageJsonHandler.addTsScripts(packageJson.scripts, target);
    PackageJsonHandler.writePackageJson({...packageJson, scripts});
    Logger.success('Scripts added to package.json!');
  }
}
