import {readFileSync} from "fs";
import {PackageJsonModel} from "../models/package-json.model";
import {resolve} from "path";

interface NodeCliModel {
  options: string[];
  scriptFile?: string;
  arguments: string[];
}

export class PackageJsonHandler {
  private static readPackageJson = (): PackageJsonModel => {
    const packageJson = JSON.parse(readFileSync('package.json', {encoding: 'utf-8'}));
    if (!packageJson.hasOwnProperty('scripts')) {
      return {...packageJson, scripts: {}} as PackageJsonModel;
    }
    return packageJson as PackageJsonModel;
  }

  private static isNodeScript = (script: string): boolean => {
    return script.startsWith('node');
  }

  private static parseNodeScript = (script: string): NodeCliModel => {
    return script
      .replace(/\s+/g, ' ')
      .split(' ')
      .reduce((acc: NodeCliModel, parameter: string, index: number) => {
        if (index == 0 || parameter.startsWith('-')) {
          return acc;
        }
        if (!acc.scriptFile) {
          const scriptFile = parameter.replace(/\.[mc]?js$/g, '.ts');
          return {...acc, scriptFile};
        }
        return {...acc, arguments: [...acc.arguments, parameter]};
      }, {options: [], arguments: []});
  }

  private static fileInTargetPath = (path: string, file?: string): boolean => {
    return !!file && resolve(file)
      .startsWith(resolve(path));
  }

  private static transformNodeScript = (script: string, path: string): string => {
    const trimmed = script.trim();
    if (!this.isNodeScript(trimmed)) {
      return trimmed;
    }
    const parsedScript = this.parseNodeScript(trimmed);
    if (parsedScript.scriptFile && this.fileInTargetPath(parsedScript.scriptFile, path)) {
      return (`ts-node ${parsedScript.scriptFile} ${parsedScript.arguments.join(' ')}`).trim();
    }
    return trimmed;
  }

  static addTsScripts = (path: string) => {
    const packageJson = this.readPackageJson();
    Object
      .entries(packageJson.scripts)
      .reduce((acc: { [key: string]: string }, [name, script]: [string, string]) => {
        const transformed = this.transformNodeScript(script, path);
        return {...acc, [name]: transformed};
      }, {} as { [key: string]: string });
  }
}
