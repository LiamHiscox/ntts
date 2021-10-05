export interface PackageJsonModel {
  "scripts": Scripts;
  [key: string]: any;
}

export interface Scripts {
  [key: string]: string
}
