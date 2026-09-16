export type ModelTier = 'powerful' | 'balanced' | 'fast'

export interface ModelInfo {
  provider: string
  model: string
  label: string
  tier: ModelTier
}
