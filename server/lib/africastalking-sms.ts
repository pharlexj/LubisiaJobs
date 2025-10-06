import { storage } from "../storage";
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

// OTP functionality for server-side use
export interface SendOtpInput {
  to: string;
  /** fixed length OTP; default 6 */
  length?: number;
  /** custom message template; use {{CODE}} placeholder */
  template?: string;
}

export interface VerifyOtpInput {
  to: string;
  otp: string;
}

export interface OtpRecord {
  code: string;
  expiresAt: number; // epoch ms
  lastSentAt: number; // epoch ms
}

// Simple in-memory OTP store (should use Redis/Database in production)
class ServerOtpStore {
  private map = new Map<string, OtpRecord>();

  get(to: string): OtpRecord | null {
    const record = this.map.get(to);
    if (!record) return null;
    
    // Check if expired
    if (Date.now() > record.expiresAt) {
      this.map.delete(to);
      return null;
    }
    
    return record;
  }

  set(to: string, record: OtpRecord): void {
    this.map.set(to, record);
  }

  delete(to: string): void {
    this.map.delete(to);
  }

  // Clean expired records
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.map.entries()) {
      if (now > record.expiresAt) {
        this.map.delete(key);
      }
    }
  }
}

// Singleton OTP store
const otpStore = new ServerOtpStore();

// Cleanup expired OTPs every 5 minutes
setInterval(() => otpStore.cleanup(), 5 * 60 * 1000);

/** Generate random numeric OTP */
const generateOtp = (len = 6): string => {
  const min = Math.pow(10, len - 1);
  const max = Math.pow(10, len) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

/** Send OTP via SMS */
export const sendOtp = async (input: SendOtpInput): Promise<string> => {
  const { to, length = 6, template = "Your verification code is {{CODE}}. Valid for 10 minutes." } = input;
  const normalizedPhone = normalizePhone(to);
  
  // Check rate limiting (don't send OTP more than once per minute)
  const existing = otpStore.get(normalizedPhone);
  if (existing && (Date.now() - existing.lastSentAt) < 60000) {
    throw new Error('Please wait before requesting another code');
  }

  const code = generateOtp(length);
  const message = template.replace('{{CODE}}', code);
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

  // Store OTP
  otpStore.set(normalizedPhone, {
    code,
    expiresAt,
    lastSentAt: Date.now()
  });

  try {
    // Send SMS
    await sendSms({ to: normalizedPhone, message });
    await storage.createOtp(normalizedPhone, code);
    return code; // In production, don't return the code
  } catch (error) {
    // Remove OTP if SMS failed
    otpStore.delete(normalizedPhone);
    throw error;
  }
};

/** Verify OTP */
export const verifyOtp = (input: VerifyOtpInput): boolean => {
  const { to, otp } = input;
  const normalizedPhone = normalizePhone(to);
  
  const stored = otpStore.get(normalizedPhone);
  if (!stored) return false;
  
  const isValid = stored.code === otp && Date.now() <= stored.expiresAt;
  
  if (isValid) {
    otpStore.delete(normalizedPhone); // Remove used OTP
  }  
  return isValid;
};