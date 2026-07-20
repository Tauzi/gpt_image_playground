import { describe, expect, it } from 'vitest'
import { calculateImageSize } from './size'

describe('calculateImageSize', () => {
  it('uses common 16:9 display resolutions for the built-in tiers', () => {
    expect(calculateImageSize('1K', '16:9')).toBe('1344x752')
    expect(calculateImageSize('2K', '16:9')).toBe('2560x1440')
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

  it('uses matching portrait presets for common ratios', () => {
    expect(calculateImageSize('2K', '9:16')).toBe('1440x2560')
    expect(calculateImageSize('2K', '2:3')).toBe('1440x2160')
    expect(calculateImageSize('2K', '3:4')).toBe('1536x2048')
  })

  it('falls back to budget-based sizing for custom ratios', () => {
    expect(calculateImageSize('2K', '5:4')).toBe('2288x1824')
  })
})
