export class PathParser {
  static win32ToPosixPath = (path: string): string => {
    return path.split(/\\+/).join('/');
  }
}
