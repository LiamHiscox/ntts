export interface Scripts {
  [key: string]: string;
}

export interface PackageJsonModel {
  main?: string;
  scripts: Scripts;
  [key: string]: unknown;
}
