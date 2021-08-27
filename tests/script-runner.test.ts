import {ScriptRunner} from "../lib/script-runner/script-runner";

test('should pipe simple script', () => {
    expect(ScriptRunner.runPipe('npm --version')).toMatch(/^\d+\.\d+\.\d+$/);
});

test('should inherit simple script', () => {
    expect(() => ScriptRunner.runInherit('npm --version')).not.toThrow();
});

test('should run script parsed result', () => {
    expect(ScriptRunner.runParsed<{name: string}>('npm ls --json --depth').name).toBe("nodejs-to-ts");
});
