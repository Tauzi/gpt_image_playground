import type { ApiProfile } from '../types'

export const DEFAULT_IMAGES_MODEL = 'gpt-image-2.5-sunburst'

export function getImageGenerationModel(profile: ApiProfile) {
  return profile.provider === 'openai' && profile.apiMode === 'responses'
    ? profile.imageGenerationModel?.trim() ?? ''
    : profile.model
}

/** 支持 xhigh / max 质量档位的模型（gpt-image-2.5 及之后的版本） */
export function supportsMaxQuality(model: string) {
  const normalized = model.trim().toLowerCase()
  return normalized.includes('gpt-image-2.5') || normalized.includes('gpt-image-2.6')
}
