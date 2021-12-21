import {appendFileSync, existsSync, writeFileSync} from "fs";
import {TsconfigHandler} from "../tsconfig-handler/tsconfig-handler";

export class ModuleDeclarator {
  static handleUntypedPackages = (untyped: string[], fileEndings: boolean = false): void => {
    if (untyped.length > 0) {
      const modules = fileEndings ?
        untyped.map(file => `declare module "*.${file}";`) :
        untyped.map(file => `declare module "${file}";\ndeclare module "${file}/*";`);
      const moduleFile = './ntts-modules.d.ts';
      if (existsSync(moduleFile)) {
        appendFileSync(moduleFile, modules.join('\n') + '\n');
      } else {
        writeFileSync(moduleFile, modules.join('\n') + '\n');
        TsconfigHandler.addModuleFile('./ntts-modules.d.ts');
      }
    }
  }
}
