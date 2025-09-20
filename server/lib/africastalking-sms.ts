/**
 * Server-side Africa's Talking SMS Utility
 * ----------------------------------------
 * Secure SMS service that runs server-side only with proper environment variable handling
 */

import africastalking from 'africastalking';

export type Environment = "production" | "sandbox";

export interface AfricasTalkingConfig {
  /** Africa's Talking username (eg. "sandbox" for testing) */
  username: string;
  /** Africa's Talking API key */
  apiKey: string;
  /** Optional sender ID/short code registered on AT */
  from?: string;
  /** Default country code for local numbers (eg. "+254") */
  defaultCountryCode?: string;
  /** Use sandbox? If username === "sandbox" this is implied */
  environment?: Environment;
}

export interface SendSmsInput {
  to: string | string[];
  message: string;
  from?: string;
}

/** Phone helpers */
export const normalizePhone = (raw: string, defaultCountry = "+254"): string => {
  let p = raw.trim();
  // Remove spaces, hyphens
  p = p.replace(/[\s-]+/g, "");
  // If it already starts with +, assume E.164
  if (p.startsWith("+")) return p;
  // 07XXXXXXXX -> +2547XXXXXXXX
  if (/^0\d{9}$/.test(p) && defaultCountry === "+254") {
    return "+254" + p.slice(1);
  }
  // 7XXXXXXXX -> +2547XXXXXXXX
  if (/^7\d{8}$/.test(p) && defaultCountry === "+254") {
    return "+254" + p;
  }
  // Fallback: prepend default country code if not present
  if (!p.startsWith("+")) return defaultCountry + p;
  return p;
};

export class AfricasTalkingSMS {
  private cfg: Required<AfricasTalkingConfig>;
  private sms: any;

  constructor(cfg: AfricasTalkingConfig) {
    const merged: Required<AfricasTalkingConfig> = {
      from: cfg.from ?? undefined,
      defaultCountryCode: cfg.defaultCountryCode ?? "+254",
      environment: cfg.environment ?? (cfg.username === "sandbox" ? "sandbox" : "production"),
      username: cfg.username,
      apiKey: cfg.apiKey,
    } as Required<AfricasTalkingConfig>;

    this.cfg = merged;

    const at = africastalking({ apiKey: this.cfg.apiKey, username: this.cfg.username });
    this.sms = at.SMS;
  }

  /** Send SMS */
  async sendSms({ to, message, from }: SendSmsInput): Promise<any> {
    const recipients = Array.isArray(to) ? to : [to];
    const normalized = recipients.map((r) => normalizePhone(r, this.cfg.defaultCountryCode));

    const payload: any = {
      to: normalized,
      message,
    };
    if (from || this.cfg.from) payload.from = from ?? this.cfg.from;

    // Africa's Talking SDK returns an object with "SMSMessageData"
    const res = await this.sms.send(payload);
    return res;
  }
}

// Singleton instance for server-side use
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME || "sandbox";
const AT_API_KEY = process.env.AFRICASTALKING_API_KEY || "";
const AT_FROM = process.env.AFRICASTALKING_FROM;
const AT_DEFAULT_CC = process.env.AT_DEFAULT_CC || "+254";

export const smsClient = new AfricasTalkingSMS({
  username: AT_USERNAME,
  apiKey: AT_API_KEY,
  from: AT_FROM,
  defaultCountryCode: AT_DEFAULT_CC,
});

export const sendSms = (input: SendSmsInput) => smsClient.sendSms(input);