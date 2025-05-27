import chalk from 'chalk';

export class LoggerService {
  private static instance: LoggerService;

  private constructor() {}

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  log(message: string): void {
    console.log(`${chalk.blue('[LOG]')} ${message}`);
  }

  success(message: string): void {
    console.log(`${chalk.green('[SUCCESS]')} ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`${chalk.redBright('[ERROR]')} ${message} : ${error}`);
  }
}
