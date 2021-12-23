import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ScriptRunner {
  /**
     * @description runs a given script only printing stderr to the parents stdio
     * @param script the script to run in the terminal.
     * @returns string the stdout from the given script.
     */
  static runSync = (script: string): string => execSync(script, { stdio: 'pipe', encoding: 'utf8' }).trim();

  /**
     * @description runs a script ignoring all it's outputs.
     * @param script the script to run in the terminal.
     */
  static runIgnore = async (script: string): Promise<void> => {
    await execAsync(script);
  };

  /**
     * @description runs a given script only printing stderr to the parents stdio
     * @param script the script to run in the terminal.
     * @returns Promise<string> the stdout from the given script.
     */
  static runPipe = async (script: string): Promise<string> => {
    const result = await execAsync(script, { encoding: 'utf8' });
    return result.stdout.trim();
  };

  /**
     * @param script the script to run in the terminal.
     * @returns Promise<T> stdout as an object from the given script.
     */
  static runParsed = async <T>(script: string): Promise<T> => {
    const result = await execAsync(script, { encoding: 'utf8' });
    return this.parseResponse<T>(result.stdout.trim());
  };

  private static parseResponse = <T>(response: string): T => JSON.parse(response) as T;
}

export default ScriptRunner;
