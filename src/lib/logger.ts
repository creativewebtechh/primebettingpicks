type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  const timestamp = formatTimestamp()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''

  switch (level) {
    case 'error':
      console.error(`${prefix} ${message}${contextStr}`)
      break
    case 'warn':
      console.warn(`${prefix} ${message}${contextStr}`)
      break
    case 'info':
      console.info(`${prefix} ${message}${contextStr}`)
      break
    default:
      console.log(`${prefix} ${message}${contextStr}`)
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
}
