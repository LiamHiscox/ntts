import { appendFileSync, existsSync, writeFileSync } from 'fs';
import TsconfigHandler from '../tsconfig-handler/tsconfig-handler';

const moduleFile = './ntts-modules.d.ts';

class ModuleDeclarator {
  static handleUntypedPackages = (untyped: string[], fileEndings = false): void => {
    if (untyped.length <= 0) { return undefined; }
    const modules = this.getModules(untyped, fileEndings);
    if (!existsSync(moduleFile)) {
      writeFileSync(moduleFile, `${modules.join('\n')}\n`);
      return TsconfigHandler.addModuleFile('./ntts-modules.d.ts');
    }
    return appendFileSync(moduleFile, `${modules.join('\n')}\n`);
  };

  private static getModules = (untyped: string[], fileEndings: boolean) => {
    if (fileEndings) { return untyped.map((file) => `declare module "*.${file}";`); }
    return untyped.map((file) => `declare module "${file}";\ndeclare module "${file}/*";`);
  };
}

export default ModuleDeclarator;
