import {ScriptRunner} from "../lib/script-runner/script-runner";

test('should pipe simple script', async () => {
    expect(await ScriptRunner.runPipe('npm --version')).toMatch(/^\d+\.\d+\.\d+$/);
});

test('should inherit simple script', () => {
    expect(async () => await ScriptRunner.runIgnore('npm --version')).not.toThrow();
});

test('should run script parsed result', async () => {
    const result = await ScriptRunner.runParsed<{name: string}>('npm ls --json --depth');
    expect(result.name).toBe("nodejs-to-ts");
});
