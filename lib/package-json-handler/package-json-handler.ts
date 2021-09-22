import {readFileSync} from "fs";

export class PackageJsonHandler {
  private static readPackageJson = () => {
    JSON.parse(readFileSync('package.json', {encoding: 'utf-8'}));
  }
}
