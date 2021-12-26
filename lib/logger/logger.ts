import { green, yellow, redBright } from 'chalk';

/* eslint no-console: "off" */
class Logger {
  static success = (text: string) => {
    console.log(green('SUCCESS'), text);
  };

  static info = (text: string) => {
    console.log('INFO', text);
  };

  static warn = (text: string) => {
    console.log(yellow('WARN'), text);
  };

  static error = (text: string) => {
    console.log(redBright('ERROR'), text);
  };
}

export default Logger;
