import { getActiveApiProfile, getCustomProviderDefinition, getMianyunImageModel, isMianyunImageProvider } from './apiProfiles'
import { callFalAiImageApi } from './falAiImageApi'
import { callOpenAICompatibleImageApi } from './openaiCompatibleImageApi'
import type { CallApiOptions, CallApiResult } from './imageApiShared'
import { getMianyunImageSize } from './paramCompatibility'

export type { CallApiOptions, CallApiResult } from './imageApiShared'
export { normalizeBaseUrl } from './devProxy'

export async function callImageApi(opts: CallApiOptions): Promise<CallApiResult> {
  const activeProfile = getActiveApiProfile(opts.settings)
  const isMianyun = isMianyunImageProvider(activeProfile.provider)
  const requestOpts = isMianyun
    ? { ...opts, params: { ...opts.params, size: getMianyunImageSize(opts.params.resolution, opts.params.size) } }
    : opts
  const profile = isMianyun
    ? { ...activeProfile, model: getMianyunImageModel(opts.settings.imageModelFamily, opts.settings.imageGenerationMode, requestOpts.params.resolution, opts.settings.customImageModel) }
    : activeProfile
  if (profile.provider === 'fal') return callFalAiImageApi(requestOpts, profile)

  return callOpenAICompatibleImageApi(requestOpts, profile, getCustomProviderDefinition(opts.settings, profile.provider))
}
