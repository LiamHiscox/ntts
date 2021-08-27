import {execSync, StdioOptions} from "child_process";

export class ScriptRunner {
    /**
     * @param script the script to run in the terminal.
     * @param stdio how the stdio should be handled.
     * @returns string the stdout from the given script.
     */
    static run(script: string, stdio: StdioOptions = 'inherit'): string {
        return execSync(script, { stdio, encoding: 'utf8' });
    }

    /**
     * @param script the script to run in the terminal.
     * @param stdio how the stdio should be handled.
     * @returns T stdout as an object from the given script.
     */
    static runParsed<T>(script: string, stdio?: StdioOptions): T {
        const result = execSync(script, { stdio, encoding: 'utf8' });
        return this.parseResponse<T>(result);
    }

    private static parseResponse<T>(response: string): T {
        return JSON.parse(response) as T;
    }
}
