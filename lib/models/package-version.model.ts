
export type PackageVersion = string;

export interface PackageVersionModel {
  dependencies: {
    [packageName: string]: {
      version: PackageVersion
    }
  }
}
