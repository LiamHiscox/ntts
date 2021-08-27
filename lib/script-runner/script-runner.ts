import {execSync} from "child_process";

export class ScriptRunner {
    /**
     * @description runs a script inheriting all it's outputs to the parents stdio
     * @param script the script to run in the terminal.
     */
    static runInherit(script: string): void {
        execSync(script, { stdio: 'inherit' });
    }

    /**
     * @description runs a given script only printing stderr to the parents stdio
     * @param script the script to run in the terminal.
     * @returns string the stdout from the given script.
     */
    static runPipe(script: string): string {
        return execSync(script, { stdio: 'pipe', encoding: 'utf8' }).trim();
    }

    /**
     * @param script the script to run in the terminal.
     * @returns T stdout as an object from the given script.
     */
    static runParsed<T>(script: string): T {
        const result = execSync(script, { stdio: 'pipe', encoding: 'utf8' }).trim();
        return this.parseResponse<T>(result);
    }

    private static parseResponse<T>(response: string): T {
        return JSON.parse(response) as T;
    }
}
