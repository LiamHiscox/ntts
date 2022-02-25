import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ScriptRunner {
  // runs a given script only printing stderr to the parents stdio
  static runSync = (script: string): string => execSync(script, { stdio: 'pipe', encoding: 'utf8' }).trim();

  // runs a script ignoring all it's outputs.
  static runIgnore = async (script: string): Promise<void> => {
    await execAsync(script);
  };

  // runs a given script only printing stderr to the parents stdio
  static runPipe = async (script: string): Promise<string> => {
    const result = await execAsync(script, { encoding: 'utf8' });
    return result.stdout.trim();
  };

  static runParsed = async <T>(script: string): Promise<T> => {
    const result = await execAsync(script, { encoding: 'utf8' });
    return this.parseResponse<T>(result.stdout.trim());
  };

  private static parseResponse = <T>(response: string): T => JSON.parse(response) as T;
}

export default ScriptRunner;
