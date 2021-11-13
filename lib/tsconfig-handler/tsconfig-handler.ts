import {existsSync, readFileSync, writeFileSync} from "fs";
import {VersionHandler} from "../dependency-installer/version-handler/version-handler";
import {join} from "path";
import {TsconfigModel} from "../models/tsconfig.model";
import {Logger} from "../logger/logger";
import {ModuleSpecifierRefactorModel} from "../models/module-specifier-refactor.model";

const pathToConfigs = join(__dirname, "..", "..", "node_modules", "@tsconfig");
const defaultConfig = join(__dirname, "tsconfig.default.json");

const nodeToConfigList: [number, string][] = [
  [10, join(pathToConfigs, "node10", "tsconfig.json")],
  [12, join(pathToConfigs, "node12", "tsconfig.json")],
  [14, join(pathToConfigs, "node14", "tsconfig.json")],
  [16, join(pathToConfigs, "node16", "tsconfig.json")]
]

export class TsconfigHandler {
  private static getTsconfig = (): TsconfigModel => {
    const nodeMajorVersion = VersionHandler.parsedNodeVersion()[0];
    const tsconfigPath = nodeToConfigList.reduce((bestConfig, entry) =>
      nodeMajorVersion >= entry[0] ? entry[1] : bestConfig, defaultConfig);
    const tsconfig = readFileSync(tsconfigPath, {encoding: 'utf-8'});
    return JSON.parse(tsconfig);
  }

  private static readConfig = (filename: string): TsconfigModel => {
    return JSON.parse(readFileSync(filename, {encoding: "utf-8"}));
  }

  private static writeToConfig = (filename: string, tsconfig: TsconfigModel, partialConfig: Partial<TsconfigModel>) => {
    writeFileSync(
      filename,
      JSON.stringify({
        ...tsconfig,
        ...partialConfig,
      }, null, 2));
  }

  /**
   * @returns string returns the name of the tsconfig file to use
   */
  static tsconfigFileName = (): string => {
    return existsSync('tsconfig.ntts.json') ? 'tsconfig.ntts.json' : 'tsconfig.json';
  }

  /**
   * @param path the path to include for the typescript configuration
   * @param ignores the files and directories to ignore while renaming the javascript files
   */
  static addConfig = (path: string, ignores: string[]) => {
    Logger.info('Adding new TypeScript configuration file');
    const tsconfig = this.getTsconfig();
    const configName = existsSync('tsconfig.json') ? 'tsconfig.ntts.json' : 'tsconfig.json';

    const partialConfig = {include: [path], exclude: ignores}
    if (configName === 'tsconfig.ntts.json') {
      TsconfigHandler.writeToConfig(configName, tsconfig, {...partialConfig, extends: "./tsconfig.json"});
      Logger.success('Added tsconfig.ntts.json file');
    } else {
      TsconfigHandler.writeToConfig(configName, tsconfig, partialConfig);
      Logger.success('Added tsconfig.json file');
    }
  }

  /**
   * @param moduleSpecifierModel
   */
  static addCompilerOptions = (moduleSpecifierModel: ModuleSpecifierRefactorModel) => {
    const configName = this.tsconfigFileName();
    const tsconfig = this.readConfig(configName);
    const partialConfig = {
      compilerOptions: {
        ...tsconfig.compilerOptions,
        resolveJsonModule: moduleSpecifierModel.allowJson || false,
        allowJs: moduleSpecifierModel.allowJson || false
      }
    }
    this.writeToConfig(configName, tsconfig, partialConfig);
  }

  static addModuleFile = (fileName: string) => {
    const configName = this.tsconfigFileName();
    const tsconfig = this.readConfig(configName);
    const partialConfig = {
      ...tsconfig,
      files: [fileName]
    }
    this.writeToConfig(configName, tsconfig, partialConfig);
  }
}
