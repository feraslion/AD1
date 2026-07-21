// Central Logging System for Enterprise POS & ERP System

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private isDev = process.env.NODE_ENV !== 'production';
  private minLevel: LogLevel = 'DEBUG';

  // ANSI colored logs for clean development debugging (using CSS styling for browser support)
  private colors: Record<LogLevel, string> = {
    DEBUG: 'color: #9e9e9e; font-weight: bold;', // Gray
    INFO: 'color: #03a9f4; font-weight: bold;',  // Blue
    WARN: 'color: #ff9800; font-weight: bold;',  // Orange
    ERROR: 'color: #f44336; font-weight: bold;', // Red
  };

  private levelValues: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  constructor(minLevel?: LogLevel) {
    if (minLevel) {
      this.minLevel = minLevel;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDev && level === 'DEBUG') return false;
    return this.levelValues[level] >= this.levelValues[this.minLevel];
  }

  private formatMessage(level: LogLevel, namespace: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${namespace}]: ${message}`;
  }

  public debug(namespace: string, message: string, ...details: any[]): void {
    if (!this.shouldLog('DEBUG')) return;
    const formatted = this.formatMessage('DEBUG', namespace, message);
    console.log(`%c${formatted}`, this.colors.DEBUG, ...details);
  }

  public info(namespace: string, message: string, ...details: any[]): void {
    if (!this.shouldLog('INFO')) return;
    const formatted = this.formatMessage('INFO', namespace, message);
    console.info(`%c${formatted}`, this.colors.INFO, ...details);
  }

  public warn(namespace: string, message: string, ...details: any[]): void {
    if (!this.shouldLog('WARN')) return;
    const formatted = this.formatMessage('WARN', namespace, message);
    console.warn(`%c${formatted}`, this.colors.WARN, ...details);
  }

  public error(namespace: string, message: string, ...details: any[]): void {
    if (!this.shouldLog('ERROR')) return;
    const formatted = this.formatMessage('ERROR', namespace, message);
    console.error(`%c${formatted}`, this.colors.ERROR, ...details);
  }
}

export const logger = new Logger();
