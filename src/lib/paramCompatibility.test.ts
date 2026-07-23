import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS } from '../types'
import { createDefaultFalProfile, createDefaultOpenAIProfile, DEFAULT_SETTINGS, normalizeSettings } from './apiProfiles'
import { getMianyunImageSize, getOutputImageLimitForSettings, normalizeParamsForSettings } from './paramCompatibility'

describe('parameter compatibility', () => {
  it('converts Mianyun ratios to exact-size presets within each tier limit', () => {
    expect(getMianyunImageSize('1K', '1:1')).toBe('1024x1024')
    expect(getMianyunImageSize('1K', '5:4')).toBe('1040x832')
    expect(getMianyunImageSize('1K', '9:16')).toBe('720x1280')
    expect(getMianyunImageSize('1K', '16:9')).toBe('1280x720')
    expect(getMianyunImageSize('1K', '4:3')).toBe('1344x1024')
    expect(getMianyunImageSize('1K', '3:2')).toBe('1536x1024')
    expect(getMianyunImageSize('1K', '4:5')).toBe('832x1040')
    expect(getMianyunImageSize('1K', '3:4')).toBe('1024x1344')
    expect(getMianyunImageSize('1K', '2:3')).toBe('1024x1536')
    expect(getMianyunImageSize('1K', '21:9')).toBe('1344x576')
    expect(getMianyunImageSize('1K', '9:21')).toBe('576x1344')
    expect(getMianyunImageSize('2K', '1:1')).toBe('2048x2048')
    expect(getMianyunImageSize('2K', '5:4')).toBe('2080x1664')
    expect(getMianyunImageSize('2K', '3:2')).toBe('2064x1376')
    expect(getMianyunImageSize('2K', '4:5')).toBe('1664x2080')
    expect(getMianyunImageSize('2K', '2:3')).toBe('1376x2064')
    expect(getMianyunImageSize('2K', '16:9')).toBe('2048x1152')
    expect(getMianyunImageSize('2K', '21:9')).toBe('2016x864')
    expect(getMianyunImageSize('2K', '9:21')).toBe('864x2016')
    expect(getMianyunImageSize('2K', '2560x1088')).toBe('2016x864')
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
