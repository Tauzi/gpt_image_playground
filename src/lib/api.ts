import { getActiveApiProfile, getCustomProviderDefinition, getImageModelForResolution, isMianyunImageProvider } from './apiProfiles'
import { callFalAiImageApi } from './falAiImageApi'
import { callOpenAICompatibleImageApi } from './openaiCompatibleImageApi'
import type { CallApiOptions, CallApiResult } from './imageApiShared'

export type { CallApiOptions, CallApiResult } from './imageApiShared'
export { normalizeBaseUrl } from './devProxy'

export async function callImageApi(opts: CallApiOptions): Promise<CallApiResult> {
  const activeProfile = getActiveApiProfile(opts.settings)
  const profile = isMianyunImageProvider(activeProfile.provider)
    ? { ...activeProfile, model: getImageModelForResolution(opts.settings.imageGenerationMode, opts.params.resolution) }
    : activeProfile
  if (profile.provider === 'fal') return callFalAiImageApi(opts, profile)

  return callOpenAICompatibleImageApi(opts, profile, getCustomProviderDefinition(opts.settings, profile.provider))
}
