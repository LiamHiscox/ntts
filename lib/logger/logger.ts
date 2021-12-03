import chalk from "chalk";

export class Logger {
  static success = (text: string) => {
    console.log(chalk.green('SUCCESS'), text);
  }

  static info = (text: string) => {
    console.log('INFO', text);
  }

  static warn = (text: string) => {
    console.log(chalk.yellow('WARN'), text);
  }

  static error = (text: string) => {
    console.log(chalk.redBright('ERROR'), text);
  }
}
