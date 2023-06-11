import { existsSync, readFileSync, writeFileSync } from 'fs';
import VersionHandler from '../dependency-installer/version-handler/version-handler.js';
import Logger from '../logger/logger.js';
import ModuleSpecifierRefactorModel from '../models/module-specifier-refactor.model.js';
import tsconfig10 from '@tsconfig/node10/tsconfig.json';
import tsconfig12 from '@tsconfig/node10/tsconfig.json';
import tsconfig14 from '@tsconfig/node10/tsconfig.json';
import tsconfig16 from '@tsconfig/node10/tsconfig.json';
import defaultConfig from './tsconfig.default.json';

const nodeToConfigList = [
  { version: 10, config: tsconfig10 },
  { version: 12, config: tsconfig12 },
  { version: 14, config: tsconfig14 },
  { version: 16, config: tsconfig16 },
];

interface TsconfigModel {
  [key: string]: unknown;
}

class TsconfigHandler {
  private static getTsconfig = (): TsconfigModel => {
    const [nodeMajorVersion] = VersionHandler.parsedNodeVersion();
    return nodeToConfigList.reduce((bestConfig: TsconfigModel, {version, config}) =>
        (nodeMajorVersion >= version ? config : bestConfig), defaultConfig);
  };

  private static readConfig = (filename: string) => JSON.parse(readFileSync(filename, { encoding: 'utf-8' }));

  private static writeToConfig = (filename: string, tsconfig: TsconfigModel, partialConfig: TsconfigModel) => {
    writeFileSync(
      filename,
      JSON.stringify({ ...tsconfig, ...partialConfig }, null, 2),
    );
  };

  static tsconfigFileName = (): string => (existsSync('tsconfig.ntts.json') ? 'tsconfig.ntts.json' : 'tsconfig.json');

  static addConfig = (path: string, ignores: string[]) => {
    Logger.info('Adding new TypeScript configuration file');
    const tsconfig = this.getTsconfig();
    const configName = existsSync('tsconfig.json') ? 'tsconfig.ntts.json' : 'tsconfig.json';
    const partialConfig = path ? { include: [path], exclude: ignores } : { exclude: ignores };
    TsconfigHandler.writeToConfig(configName, tsconfig, partialConfig);
    Logger.success(`Added ${configName} file`);
  };

  static addCompilerOptions = (moduleSpecifierModel: ModuleSpecifierRefactorModel) => {
    const configName = this.tsconfigFileName();
    const tsconfig = this.readConfig(configName);
    const compilerOptions = {
      ...tsconfig.compilerOptions,
      resolveJsonModule: moduleSpecifierModel.allowJson || false,
      allowJs: moduleSpecifierModel.allowJs || false,
    };
    this.writeToConfig(configName, tsconfig, { compilerOptions });
  };

  static addModuleFile = (fileName: string) => {
    const configName = this.tsconfigFileName();
    const tsconfig = this.readConfig(configName);
    const partialConfig = { ...tsconfig, files: [fileName] };
    this.writeToConfig(configName, tsconfig, partialConfig);
  };
}

export default TsconfigHandler;
