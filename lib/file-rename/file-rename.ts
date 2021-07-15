import {lstatSync, readdirSync, renameSync, Stats} from "fs";
import {join} from "path";

// TODO: what todo if typescript file with same name already exists

export class FileRename {
    private static getStats(path: string): Stats {
        return lstatSync(path);
    }

    private static renameFile(path: string): void {
        const newPath = path.replace(/js$/, 'ts');
        renameSync(path, newPath);
    }

    static renameFiles(path: string): void {
        readdirSync(path).forEach(name => {
            const fullPath = join(path, name);
            const stats = FileRename.getStats(fullPath);
            if (stats.isFile() && name.endsWith('.js')) {
                FileRename.renameFile(fullPath);
            } else if (stats.isDirectory()) {
                FileRename.renameFiles(fullPath);
            }
        })
    }
}
