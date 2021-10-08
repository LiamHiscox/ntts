export interface PackageJsonModel {
  "main"?: string;
  "scripts": Scripts;
  [key: string]: any;
}

export interface Scripts {
  [key: string]: string
}
