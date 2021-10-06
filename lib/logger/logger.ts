import {green, redBright, yellow} from "chalk";

export class Logger {
  static success = (text: string) => {
    console.log(green('SUCCESS'), text);
  }

  static info = (text: string) => {
    console.log('INFO', text);
  }

  static warn = (text: string) => {
    console.log(yellow('WARN'), text);
  }

  static error = (text: string) => {
    console.log(redBright('ERROR'), text);
  }
}
