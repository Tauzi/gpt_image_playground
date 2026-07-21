import { describe, expect, it } from 'vitest'
import { calculateImageSize } from './size'

describe('calculateImageSize', () => {
  it('uses common 16:9 display resolutions for the built-in tiers', () => {
    expect(calculateImageSize('1K', '16:9')).toBe('1024x576')
    expect(calculateImageSize('2K', '16:9')).toBe('2048x1152')
    expect(calculateImageSize('4K', '16:9')).toBe('3840x2160')
  })

  it('uses the documented exact-size presets for the 1K tier', () => {
    const expected = {
      '1:1': '1024x1024',
      '5:4': '1280x1024',
      '9:16': '576x1024',
      '21:9': '1456x624',
      '16:9': '1024x576',
      '4:3': '1024x768',
      '3:2': '1536x1024',
      '4:5': '1024x1280',
      '3:4': '768x1024',
      '2:3': '1024x1536',
    }

    for (const [ratio, size] of Object.entries(expected)) {
      expect(calculateImageSize('1K', ratio)).toBe(size)
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
