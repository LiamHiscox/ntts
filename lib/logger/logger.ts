import chalk from 'chalk';

/* eslint no-console: "off" */
class Logger {
  static success = (text: string) => {
    console.log(chalk.green('SUCCESS'), text);
  };

  static info = (text: string) => {
    console.log('INFO', text);
  };

  static warn = (text: string) => {
    console.log(chalk.yellow('WARN'), text);
  };

  static error = (text: string) => {
    console.log(chalk.redBright('ERROR'), text);
  };
}

export default Logger;
