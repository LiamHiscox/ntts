import {appendFileSync, existsSync, writeFileSync} from "fs";
import {TsconfigHandler} from "../tsconfig-handler/tsconfig-handler";

const moduleFile = './ntts-modules.d.ts';

export class ModuleDeclarator {
  static handleUntypedPackages = (untyped: string[], fileEndings: boolean = false): void => {
    if (untyped.length <= 0)
      return;
    const modules = this.getModules(untyped, fileEndings);
    if (!existsSync(moduleFile)) {
      writeFileSync(moduleFile, modules.join('\n') + '\n');
      return TsconfigHandler.addModuleFile('./ntts-modules.d.ts');
    }
    return appendFileSync(moduleFile, modules.join('\n') + '\n');
  }

  private static getModules = (untyped: string[], fileEndings: boolean) => {
    if (fileEndings)
      return untyped.map(file => `declare module "*.${file}";`);
    return untyped.map(file => `declare module "${file}";\ndeclare module "${file}/*";`);
  }
}
