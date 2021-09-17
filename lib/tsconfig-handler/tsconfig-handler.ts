import {existsSync, writeFileSync} from "fs";
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
  private static getTsConfig = (): string => {
    const nodeMajorVersion = +VersionHandler.nodeVersion().split('.')[0];
    return nodeToConfigList.reduce(
      (bestConfig, entry) => nodeMajorVersion >= entry[0] ? entry[1] : bestConfig,
      defaultConfig
    );
  }

  // TODO: reformat path
  static addConfig = (path: string) => {
    const tsConfig = this.getTsConfig();
    if (!existsSync('tsconfig.json')) {
      writeFileSync('tsconfig.json', tsConfig);
    } else {
      const parsedConfig = {
        ...JSON.parse(tsConfig),
        include: [path]
      }
      writeFileSync('tsconfig.ntts.json', JSON.stringify(parsedConfig));
    }
  }
}
