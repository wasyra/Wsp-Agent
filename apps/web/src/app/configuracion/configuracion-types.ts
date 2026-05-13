export type LlmProvider = "openai" | "gemini";

export type Settings = {
  twilio_account_sid: string;
  webhook_base_url: string;
  twilio_validate_signature: boolean;
  llm_provider: LlmProvider;
  openai_model: string;
  gemini_model: string;
  twilio_auth_token_configured: boolean;
  openai_api_key_configured: boolean;
  gemini_api_key_configured: boolean;
  twilio_webhook_full_url: string;
  agent_business_summary: string;
  agent_instructions: string;
  agent_lead_capture: string;
  agent_catalog: string;
  agent_pricing_rules: string;
  agent_shipping_zones: string;
  agent_payment_methods: string;
  agent_returns_warranty: string;
  agent_faq: string;
  agent_off_hours_message: string;
  agent_hard_rules: string;
};

export type SettingsTab = "general" | "agent";
