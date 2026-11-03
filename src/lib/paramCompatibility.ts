import { DEFAULT_PARAMS, type AppSettings, type TaskParams } from '../types'
import { getActiveApiProfile, isMianyunImageProvider, isOpenAICompatibleProvider } from './apiProfiles'
import { getImageGenerationModel, isGptImage25Model } from './imageModels'
import { calculateImageSize, normalizeCodexCliImageSize, normalizeImageSize, parseRatio } from './size'

export const DEFAULT_FAL_IMAGE_SIZE = '1360x1024'
export const MAX_FAL_OUTPUT_IMAGES = 4
export const MAX_OPENAI_OUTPUT_IMAGES = 10

const LEGACY_MIANYUN_SIZE_MAP: Record<string, string> = {
  '1K:1536x1024': '1008x672',
  '1K:1024x1536': '672x1008',
  '1K:1344x1024': '1024x768',
  '1K:1024x1344': '768x1024',
  '1K:1280x1024': '1040x832',
  '1K:1024x576': '1280x720',
  '1K:1024x1280': '832x1040',
  '1K:1456x624': '1344x576',
  '2K:2560x2048': '2080x1664',
  '2K:3072x2048': '2064x1376',
  '2K:2048x2560': '1664x2080',
  '2K:2048x3072': '1376x2064',
  '2K:2560x1088': '2016x864',
  '4K:3456x2304': '3504x2336',
  '4K:2304x3456': '2336x3504',
  '4K:3200x2400': '3264x2448',
  '4K:2400x3200': '2448x3264',
  '4K:3840x1600': '3808x1632',
}

export function getMianyunImageSize(resolution: TaskParams['resolution'], size: string) {
  const trimmed = size.trim()
  if (/^\d+\s*[xX×]\s*\d+$/.test(trimmed)) {
    const exact = trimmed.replace(/\s*[xX×]\s*/, 'x')
    return LEGACY_MIANYUN_SIZE_MAP[`${resolution}:${exact}`] ?? exact
  }
  const ratio = trimmed && trimmed !== 'auto' && parseRatio(trimmed) ? trimmed : '1:1'
  return calculateImageSize(resolution, ratio) ?? calculateImageSize(resolution, '1:1') ?? '1024x1024'
}

export function getOutputImageLimitForSettings(settings: AppSettings) {
  const provider = getActiveApiProfile(settings).provider
  if (isMianyunImageProvider(provider)) return 1
  return provider === 'fal' ? MAX_FAL_OUTPUT_IMAGES : MAX_OPENAI_OUTPUT_IMAGES
}

export function normalizeParamsForSettings(
  params: TaskParams,
  settings: AppSettings,
  options: { hasInputImages?: boolean } = {},
): TaskParams {
  const activeProfile = getActiveApiProfile(settings)
  const outputImageLimit = getOutputImageLimitForSettings(settings)
  const resolution = params.resolution === '2K' || params.resolution === '4K' ? params.resolution : '1K'
  const nextParams: TaskParams = {
    ...params,
    resolution,
    size: isMianyunImageProvider(activeProfile.provider)
      ? getMianyunImageSize(resolution, params.size)
      : normalizeImageSize(params.size) || DEFAULT_PARAMS.size,
    n: Math.min(outputImageLimit, Math.max(1, params.n || DEFAULT_PARAMS.n)),
  }

  if (isOpenAICompatibleProvider(settings, activeProfile.provider) && activeProfile.codexCli) {
    nextParams.size = normalizeCodexCliImageSize(nextParams.size)
    nextParams.quality = DEFAULT_PARAMS.quality
  }

  if (activeProfile.provider === 'fal') {
    if (!options.hasInputImages && nextParams.size === 'auto') nextParams.size = DEFAULT_FAL_IMAGE_SIZE
    if (nextParams.quality === 'auto') nextParams.quality = 'high'
    nextParams.moderation = DEFAULT_PARAMS.moderation
    nextParams.output_compression = DEFAULT_PARAMS.output_compression
  }

  if ((nextParams.quality === 'xhigh' || nextParams.quality === 'max') && !isGptImage25Model(getImageGenerationModel(activeProfile))) {
    nextParams.quality = 'high'
  }

  if (nextParams.output_format === 'png') {
    nextParams.output_compression = DEFAULT_PARAMS.output_compression
  }

  return nextParams
}

export function getChangedParams(current: TaskParams, next: TaskParams): Partial<TaskParams> {
  const patch: Partial<TaskParams> = {}
  for (const key of Object.keys(next) as Array<keyof TaskParams>) {
    if (current[key] !== next[key]) {
      ;(patch as Record<keyof TaskParams, TaskParams[keyof TaskParams]>)[key] = next[key]
    }
  }
  return patch
}
