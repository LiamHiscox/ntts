import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import VersionHandler from '../dependency-installer/version-handler/version-handler';
import TsconfigModel from '../models/tsconfig.model';
import Logger from '../logger/logger';
import ModuleSpecifierRefactorModel from '../models/module-specifier-refactor.model';

const pathToConfigs = join(__dirname, '..', '..', 'node_modules', '@tsconfig');
const defaultConfig = join(__dirname, 'tsconfig.default.json');

const nodeToConfigList: { version: number, path: string }[] = [
  { version: 10, path: join(pathToConfigs, 'node10', 'tsconfig.json') },
  { version: 12, path: join(pathToConfigs, 'node12', 'tsconfig.json') },
  { version: 14, path: join(pathToConfigs, 'node14', 'tsconfig.json') },
  { version: 16, path: join(pathToConfigs, 'node16', 'tsconfig.json') },
];

class TsconfigHandler {
  private static getTsconfig = (): TsconfigModel => {
    const nodeMajorVersion = VersionHandler.parsedNodeVersion()[0];
    const tsconfigPath = nodeToConfigList.reduce((bestConfig, {version, path}) => (nodeMajorVersion >= version ? path : bestConfig), defaultConfig);
    const tsconfig = readFileSync(tsconfigPath, { encoding: 'utf-8' });
    return JSON.parse(tsconfig);
  };

  private static readConfig = (filename: string): TsconfigModel => JSON.parse(readFileSync(filename, { encoding: 'utf-8' }));

  private static writeToConfig = (filename: string, tsconfig: TsconfigModel, partialConfig: Partial<TsconfigModel>) => {
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
