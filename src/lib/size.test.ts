import { describe, expect, it } from 'vitest'
import { calculateImageSize } from './size'

describe('calculateImageSize', () => {
  it('uses common 16:9 display resolutions for the built-in tiers', () => {
    expect(calculateImageSize('1K', '16:9')).toBe('1280x720')
    expect(calculateImageSize('2K', '16:9')).toBe('2048x1152')
    expect(calculateImageSize('4K', '16:9')).toBe('3840x2160')
  })

  it('uses the documented exact-size presets for the 1K tier', () => {
    const expected = {
      '1:1': '1024x1024',
      '3:2': '1008x672',
      '2:3': '672x1008',
      '16:9': '1280x720',
      '9:16': '720x1280',
      '4:3': '1024x768',
      '3:4': '768x1024',
      '5:4': '1040x832',
      '4:5': '832x1040',
      '21:9': '1344x576',
      '9:21': '576x1344',
    }

    for (const [ratio, size] of Object.entries(expected)) {
      expect(calculateImageSize('1K', ratio)).toBe(size)
    }
  })

  it('uses the configured 2K exact-size presets', () => {
    const expected = {
      '1:1': '2048x2048',
      '16:9': '2048x1152',
      '9:16': '1152x2048',
      '4:3': '2048x1536',
      '3:4': '1536x2048',
      '5:4': '2080x1664',
      '4:5': '1664x2080',
      '3:2': '2064x1376',
      '2:3': '1376x2064',
      '21:9': '2016x864',
      '9:21': '864x2016',
    }

    for (const [ratio, size] of Object.entries(expected)) {
      expect(calculateImageSize('2K', ratio)).toBe(size)
      const [width, height] = size.split('x').map(Number)
      expect(width % 16).toBe(0)
      expect(height % 16).toBe(0)
      expect(width * height).toBeLessThanOrEqual(4_194_304)
    }
  })

  it('uses the configured 4K exact-size presets', () => {
    const expected = {
      '1:1': '2880x2880',
      '16:9': '3840x2160',
      '9:16': '2160x3840',
      '5:4': '3200x2560',
      '4:5': '2560x3200',
      '4:3': '3264x2448',
      '3:4': '2448x3264',
      '3:2': '3504x2336',
      '2:3': '2336x3504',
      '21:9': '3808x1632',
      '9:21': '1632x3808',
    }

    for (const [ratio, size] of Object.entries(expected)) {
      expect(calculateImageSize('4K', ratio)).toBe(size)
      const [width, height] = size.split('x').map(Number)
      expect(width * height).toBeLessThanOrEqual(8_294_400)
    }
  })

  it('falls back to budget-based sizing for custom ratios', () => {
    const size = calculateImageSize('2K', '7:5')
    expect(size).not.toBeNull()
    const [width, height] = size!.split('x').map(Number)
    expect(width * height).toBeLessThanOrEqual(4_194_304)
  })
})
