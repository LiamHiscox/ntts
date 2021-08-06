import {execSync} from "child_process";

export class ScriptRunner {
    /**
     * @param script the script to run in the terminal.
     * @param root the location to execute the script at.
     */
    static run = (script: string, root: string): void => {
        execSync(script, { stdio: 'inherit', cwd: root });
    }
}
