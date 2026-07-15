import { logger } from '../logger'

describe('logger', () => {
  const originalError = console.error
  const originalWarn = console.warn
  const originalInfo = console.info
  const originalLog = console.log

  let errorSpy: jest.SpyInstance
  let warnSpy: jest.SpyInstance
  let infoSpy: jest.SpyInstance
  let logSpy: jest.SpyInstance

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation()
    warnSpy = jest.spyOn(console, 'warn').mockImplementation()
    infoSpy = jest.spyOn(console, 'info').mockImplementation()
    logSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    errorSpy.mockRestore()
    warnSpy.mockRestore()
    infoSpy.mockRestore()
    logSpy.mockRestore()
  })

  afterAll(() => {
    console.error = originalError
    console.warn = originalWarn
    console.info = originalInfo
    console.log = originalLog
  })

  it('logs error level to console.error', () => {
    logger.error('test error')
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).toContain('ERROR')
    expect(errorSpy.mock.calls[0][0]).toContain('test error')
  })

  it('logs warn level to console.warn', () => {
    logger.warn('test warn')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('WARN')
  })

  it('logs info level to console.info', () => {
    logger.info('test info')
    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(infoSpy.mock.calls[0][0]).toContain('INFO')
  })

  it('logs debug level to console.log', () => {
    logger.debug('test debug')
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toContain('debug')
  })

  it('includes ISO timestamp', () => {
    logger.info('timestamp test')
    const output = infoSpy.mock.calls[0][0]
    expect(output).toMatch(/^\[\d{4}-\d{2}-\d{2}T/)
  })

  it('includes context as JSON', () => {
    logger.info('context test', { requestId: 'abc-123', userId: 'u1' })
    const output = infoSpy.mock.calls[0][0]
    expect(output).toContain('"requestId":"abc-123"')
    expect(output).toContain('"userId":"u1"')
  })
})
