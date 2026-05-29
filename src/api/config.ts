import { publicRequest } from './client'

export type PublicConfigDTO = {
  turnstileSiteKey?: string | null
}

export async function getPublicConfig(): Promise<PublicConfigDTO> {
  const payload = await publicRequest<{ data?: PublicConfigDTO }>('/public-config')
  return payload.data ?? {}
}