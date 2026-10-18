import { createBusinessCode } from '@/utils/business_code'

describe('client business codes', () => {
  const originalCrypto = Object.getOwnPropertyDescriptor(window, 'crypto')
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-16T09:45:30.123Z'))
    Object.defineProperty(window, 'crypto', { configurable: true, value: { getRandomValues: jest.fn(bytes => { bytes.set([0xa7, 0xf2, 0x9c]); return bytes }) }})
  })
  afterEach(() => { jest.restoreAllMocks(); if (originalCrypto) Object.defineProperty(window, 'crypto', originalCrypto); else delete window.crypto })
  it('formats Shanghai time to the minute and a zero-padded uppercase random suffix', () => {
    expect(createBusinessCode('PRJ')).toBe('PRJ-202610161745-A7F29C')
    expect(createBusinessCode('SUB')).toBe('SUB-202610161745-A7F29C')
    expect(createBusinessCode('SOP')).toBe('SOP-202610161745-A7F29C')
    expect(createBusinessCode('LOC')).toBe('LOC-202610161745-A7F29C')
  })
  it('uses fresh random bytes within the same minute', () => {
    window.crypto.getRandomValues.mockImplementationOnce(bytes => { bytes.set([0, 1, 2]); return bytes })
    expect(createBusinessCode('PRJ')).toBe('PRJ-202610161745-000102')
    expect(createBusinessCode('PRJ')).toBe('PRJ-202610161745-A7F29C')
    expect(window.crypto.getRandomValues).toHaveBeenCalledTimes(2)
  })
  it('changes date correctly at the Shanghai midnight boundary', () => {
    Date.now.mockReturnValue(Date.parse('2026-10-15T16:00:00.001Z'))
    expect(createBusinessCode('SOP')).toBe('SOP-202610160000-A7F29C')
  })
  it('does not include seconds or milliseconds in the timestamp', () => {
    const first = createBusinessCode('PRJ')
    Date.now.mockReturnValue(Date.parse('2026-10-16T09:45:59.999Z'))
    expect(createBusinessCode('PRJ')).toBe(first)
    Date.now.mockReturnValue(Date.parse('2026-10-16T09:46:00.000Z'))
    expect(createBusinessCode('PRJ')).toBe('PRJ-202610161746-A7F29C')
  })
  it('does not silently fall back to weak random numbers', () => {
    Object.defineProperty(window, 'crypto', { configurable: true, value: undefined })
    expect(() => createBusinessCode('PRJ')).toThrow('不支持安全随机数')
    expect(() => createBusinessCode('INVALID')).toThrow('不支持的业务编号类型')
  })
})
