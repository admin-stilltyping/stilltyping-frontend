export type ConnectorType = 'whatsapp' | 'telegram' | 'web'

export interface AutomationOption {
  id: string
  label: string
  description?: string
  next?: string
  action?: {
    module: string
    function: string
    input_param?: string
  }
}

export interface AutomationNode {
  id: string
  type: 'menu' | 'message' | 'action'
  message: string
  options?: AutomationOption[]
}

export interface AutomationFlow {
  welcome_message: string
  fallback_message: string
  nodes: AutomationNode[]
}

export interface ConnectorAutomation {
  id: string
  business_id: string
  connector_type: ConnectorType
  name: string
  is_active: boolean
  flow: AutomationFlow
  created_at: string
  updated_at: string
}

export interface AutomationModuleFunction {
  label: string
  input_param?: string
  returns: 'list' | 'item'
}

export interface AutomationModule {
  label: string
  functions: Record<string, AutomationModuleFunction>
}

export type AutomationModuleCatalog = Record<string, AutomationModule>
