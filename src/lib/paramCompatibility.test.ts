import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS } from '../types'
import { createDefaultFalProfile, createDefaultOpenAIProfile, DEFAULT_SETTINGS, normalizeSettings } from './apiProfiles'
import { getMianyunImageSize, getOutputImageLimitForSettings, normalizeParamsForSettings } from './paramCompatibility'

describe('parameter compatibility', () => {
  it('converts Mianyun ratios to exact-size presets within each tier limit', () => {
    expect(getMianyunImageSize('1K', '1:1')).toBe('1024x1024')
    expect(getMianyunImageSize('1K', '3:2')).toBe('1248x832')
    expect(getMianyunImageSize('1K', '2:3')).toBe('832x1248')
    expect(getMianyunImageSize('1K', '21:9')).toBe('1456x624')
    expect(getMianyunImageSize('2K', '1:1')).toBe('2048x2048')
    expect(getMianyunImageSize('2K', '5:4')).toBe('2560x2048')
    expect(getMianyunImageSize('2K', '3:2')).toBe('3072x2048')
    expect(getMianyunImageSize('2K', '4:5')).toBe('2048x2560')
    expect(getMianyunImageSize('2K', '2:3')).toBe('2048x3072')
    expect(getMianyunImageSize('4K', '16:9')).toBe('3840x2160')
    expect(getMianyunImageSize('1K', 'auto')).toBe('1024x1024')
  })

  it('keeps Mianyun exact sizes unchanged', () => {
    expect(getMianyunImageSize('1K', '1024x1024')).toBe('1024x1024')
  })

  it('limits OpenAI output count to 10', () => {
    const openAIProfile = createDefaultOpenAIProfile({ apiKey: 'test-key', streamImages: false })
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      profiles: [openAIProfile],
      activeProfileId: openAIProfile.id,
    })

    expect(getOutputImageLimitForSettings(settings)).toBe(10)
    expect(normalizeParamsForSettings({ ...DEFAULT_PARAMS, n: 12 }, settings).n).toBe(10)
  })

  it('limits fal.ai output count to 4', () => {
    const falProfile = createDefaultFalProfile({ apiKey: 'fal-key' })
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      profiles: [falProfile],
      activeProfileId: falProfile.id,
    })

    expect(getOutputImageLimitForSettings(settings)).toBe(4)
    expect(normalizeParamsForSettings({ ...DEFAULT_PARAMS, n: 8 }, settings).n).toBe(4)
  })

  it('keeps OpenAI streaming output count so the request can disable streaming', () => {
    const openAIProfile = createDefaultOpenAIProfile({ apiKey: 'test-key', streamImages: true })
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      profiles: [openAIProfile],
      activeProfileId: openAIProfile.id,
    })

    expect(normalizeParamsForSettings({ ...DEFAULT_PARAMS, n: 4 }, settings).n).toBe(4)
  })

  it('only replaces fal.ai auto size in text-to-image mode', () => {
    const falProfile = createDefaultFalProfile({ apiKey: 'fal-key' })
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      profiles: [falProfile],
      activeProfileId: falProfile.id,
    })

    expect(normalizeParamsForSettings({ ...DEFAULT_PARAMS, size: 'auto' }, settings).size).toBe('1360x1024')
    expect(normalizeParamsForSettings({ ...DEFAULT_PARAMS, size: 'auto' }, settings, { hasInputImages: true }).size).toBe('auto')
  })
})
