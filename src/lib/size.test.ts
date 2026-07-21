import { describe, expect, it } from 'vitest'
import { calculateImageSize } from './size'

describe('calculateImageSize', () => {
  it('uses common 16:9 display resolutions for the built-in tiers', () => {
    expect(calculateImageSize('1K', '16:9')).toBe('1344x752')
    expect(calculateImageSize('2K', '16:9')).toBe('2048x1152')
    expect(calculateImageSize('4K', '16:9')).toBe('3840x2160')
  })

  it('uses exact-size presets within the 1K pixel limit', () => {
    expect(calculateImageSize('1K', '1:1')).toBe('1024x1024')
    expect(calculateImageSize('1K', '3:2')).toBe('1248x832')
    expect(calculateImageSize('1K', '2:3')).toBe('832x1248')
    expect(calculateImageSize('1K', '21:9')).toBe('1456x624')

    for (const ratio of ['1:1', '3:2', '2:3', '16:9', '9:16', '4:3', '3:4', '21:9']) {
      const [width, height] = calculateImageSize('1K', ratio)!.split('x').map(Number)
      expect(width % 16).toBe(0)
      expect(height % 16).toBe(0)
      expect(width * height).toBeLessThanOrEqual(1_048_576)
    }
  })

  it('uses the configured 2K exact-size presets', () => {
    const expected = {
      '1:1': '2048x2048',
      '5:4': '2560x2048',
      '9:16': '1152x2048',
      '16:9': '2048x1152',
      '4:3': '2048x1536',
      '3:2': '3072x2048',
      '4:5': '2048x2560',
      '3:4': '1536x2048',
      '2:3': '2048x3072',
    }

    for (const [ratio, size] of Object.entries(expected)) {
      expect(calculateImageSize('2K', ratio)).toBe(size)
      const [width, height] = size.split('x').map(Number)
      expect(width % 16).toBe(0)
      expect(height % 16).toBe(0)
      expect(width * height).toBeLessThanOrEqual(6_291_456)
    }
  })

  it('falls back to budget-based sizing for custom ratios', () => {
    const size = calculateImageSize('2K', '7:5')
    expect(size).not.toBeNull()
    const [width, height] = size!.split('x').map(Number)
    expect(width * height).toBeLessThanOrEqual(6_291_456)
  })
})
