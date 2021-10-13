import {existsSync, readFileSync, writeFileSync} from "fs";
import {VersionHandler} from "../dependency-installer/version-handler/version-handler";
import {join} from "path";
import {TsconfigModel} from "../models/tsconfig.model";
import {Logger} from "../logger/logger";

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
    if (!existsSync('tsconfig.json')) {
      TsconfigHandler.writeToConfig(
        'tsconfig.json',
        tsconfig,
        {
          include: [path],
          exclude: ignores
        }
      );
      Logger.success('Added tsconfig.json file');
    } else {
      TsconfigHandler.writeToConfig(
        'tsconfig.ntts.json',
        tsconfig,
        {
          include: [path],
          exclude: ignores,
          extends: "./tsconfig.json"
        }
      );
      Logger.info('Added tsconfig.ntts.json file');
    }
  }
}
