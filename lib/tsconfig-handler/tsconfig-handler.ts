import {existsSync, readFileSync, writeFileSync} from "fs";
import {VersionHandler} from "../dependency-installer/version-handler/version-handler";
import {join} from "path";

const pathToConfigs = join(__dirname, "..", "..", "node_modules", "@tsconfig");
const defaultConfig = join(__dirname, "tsconfig.default.json");

const nodeToConfigList: [number, string][] = [
  [10, join(pathToConfigs, "node10", "tsconfig.json")],
  [12, join(pathToConfigs, "node12", "tsconfig.json")],
  [14, join(pathToConfigs, "node14", "tsconfig.json")],
  [16, join(pathToConfigs, "node16", "tsconfig.json")]
]

export class TsconfigHandler {
  private static getTsconfig = (): TsconfigHandler => {
    const nodeMajorVersion = VersionHandler.parsedNodeVersion()[0];
    const tsconfigPath = nodeToConfigList.reduce((bestConfig, entry) =>
        nodeMajorVersion >= entry[0] ? entry[1] : bestConfig, defaultConfig);
    const tsconfig = readFileSync(tsconfigPath, {encoding: 'utf-8'});
    return JSON.parse(tsconfig);
  }

  static addConfig = (path: string) => {
    const tsconfig = this.getTsconfig();
    if (!existsSync('tsconfig.json')) {
      writeFileSync(
        'tsconfig.json',
        JSON.stringify({
          ...tsconfig,
          include: [path]
        }));
    } else {
      writeFileSync(
        'tsconfig.ntts.json',
        JSON.stringify({
          ...tsconfig,
          extends: "./tsconfig.json",
          include: [path]
        }));
    }
  }
}
