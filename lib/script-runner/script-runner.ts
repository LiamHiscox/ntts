import {execSync, ExecSyncOptionsWithBufferEncoding} from "child_process";

export class ScriptRunner {
    /**
     * @param script the script to run in the terminal.
     * @param options the options for execSync function.
     * @returns the stdout as a buffer from the given script.
     */
    static run = (script: string, options?: ExecSyncOptionsWithBufferEncoding): Buffer => {
        return execSync(script, { stdio: 'inherit',  ...options });
    }
}
