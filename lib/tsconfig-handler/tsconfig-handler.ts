import {existsSync, readFileSync, writeFileSync} from "fs";
import {VersionHandler} from "../dependency-installer/version-handler/version-handler";
import {join} from "path";
import {TsconfigModel} from "../models/tsconfig.model";

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
   * @param path the path to include for the typescript configuration
   */
  static addConfig = (path: string) => {
    const tsconfig = this.getTsconfig();
    if (!existsSync('tsconfig.json')) {
      TsconfigHandler.writeToConfig(
        'tsconfig.json',
        tsconfig,
        {include: [path]}
      );
    } else {
      TsconfigHandler.writeToConfig(
        'tsconfig.ntts.json',
        tsconfig,
        {include: [path], extends: "./tsconfig.json"}
      );
    }
  }
}
