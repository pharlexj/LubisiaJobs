/**
 * Africa's Talking SMS Utility (TypeScript)
 * ----------------------------------------
 * Lightweight wrapper around africastalking SDK with:
 *  - Simple sendSms API
 *  - OTP generation, storage, verification (pluggable store)
 *  - Phone normalization helpers (E.164, KE defaults)
 *  - Idempotency guard + basic rate limiting hooks
 *  - Sandbox support
 *
 * Usage:
 *   import { smsClient, sendSms, sendOtp, verifyOtp } from "./africastalking-sms";
 *
 *   await sendSms({ to: "+2547XXXXXXXX", message: "Hello" });
 *   const code = await sendOtp({ to: "+2547XXXXXXXX" });
 *   const ok = await verifyOtp({ to: "+2547XXXXXXXX", otp: "123456" });
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// If your project uses ESM, keep the import; for CJS/ESM-agnostic, use dynamic require.
// Africa's Talking SDK has mixed typings; this pattern works in both build targets.
import africastalking from 'africastalking'
const createAT = (cfg: { apiKey: string; username: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // const africastalking = require("africastalking");
  return africastalking(cfg);
};

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
  /** Min seconds between OTP sends to the same number */
  otpSendCooldownSec?: number;
  /** OTP TTL in seconds */
  otpTtlSec?: number;
}

export interface SendSmsInput {
  to: string | string[];
  message: string;
  from?: string;
}

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

export interface OtpStore {
  get(to: string): Promise<OtpRecord | null> | OtpRecord | null;
  set(to: string, rec: OtpRecord): Promise<void> | void;
  delete(to: string): Promise<void> | void;
}

/** In-memory fallback store (use Redis/DB in production). */
export class MemoryOtpStore implements OtpStore {
  private map = new Map<string, OtpRecord>();
  get(to: string): OtpRecord | null {
    return this.map.get(to) ?? null;
  }
  set(to: string, rec: OtpRecord): void {
    this.map.set(to, rec);
  }
  delete(to: string): void {
    this.map.delete(to);
  }
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

/** Random numeric OTP */
export const generateOtp = (len = 6): string => {
  const min = Math.pow(10, len - 1);
  const max = Math.pow(10, len) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

export class AfricasTalkingSMS {
  private cfg: Required<AfricasTalkingConfig>;
  private sms: any;
  private store: OtpStore;

  constructor(cfg: AfricasTalkingConfig, store: OtpStore = new MemoryOtpStore()) {
    const merged: Required<AfricasTalkingConfig> = {
      from: cfg.from ?? undefined,
      defaultCountryCode: cfg.defaultCountryCode ?? "+254",
      environment: cfg.environment ?? (cfg.username === "sandbox" ? "sandbox" : "production"),
      otpSendCooldownSec: cfg.otpSendCooldownSec ?? 45,
      otpTtlSec: cfg.otpTtlSec ?? 10 * 60,
      username: cfg.username,
      apiKey: cfg.apiKey,
    } as Required<AfricasTalkingConfig>;

    this.cfg = merged;
    this.store = store;

    const at = createAT({ apiKey: this.cfg.apiKey, username: this.cfg.username });
    this.sms = at.SMS;
  }

  /** low-level send */
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

  /** high-level OTP send; stores code & cooldown */
  async sendOtp({ to, length = 6, template }: SendOtpInput): Promise<{ code: string; to: string; expiresAt: number }> {
    const phone = normalizePhone(to, this.cfg.defaultCountryCode);

    const now = Date.now();
    const existing = await this.store.get(phone);
    if (existing && now - existing.lastSentAt < this.cfg.otpSendCooldownSec * 1000) {
      // Respect cooldown but re-use the same code (avoid flooding)
      const ttlLeft = Math.max(0, existing.expiresAt - now);
      return { code: existing.code, to: phone, expiresAt: existing.expiresAt };
    }

    const code = generateOtp(length);
    const expiresAt = now + this.cfg.otpTtlSec * 1000;

    const message = (template ?? "Your verification code is {{CODE}}. It expires in 10 minutes.")
      .replace("{{CODE}}", code);

    await this.sendSms({ to: phone, message });

    await this.store.set(phone, { code, expiresAt, lastSentAt: now });

    return { code, to: phone, expiresAt };
  }

  /** verify and consume OTP */
  async verifyOtp({ to, otp }: VerifyOtpInput): Promise<boolean> {
    const phone = normalizePhone(to, this.cfg.defaultCountryCode);
    const rec = await this.store.get(phone);
    if (!rec) return false;
    const now = Date.now();
    const ok = rec.code === otp && now <= rec.expiresAt;
    if (ok) await this.store.delete(phone);
    return ok;
  }
}

// ---- Singleton & convenience exports ------------------------------------

// Pull from env by default
const AT_USERNAME = process.env.AT_USERNAME || process.env.AFRICASTALKING_USERNAME || "sandbox";
const AT_API_KEY = process.env.AT_API_KEY || process.env.AFRICASTALKING_API_KEY || "";
const AT_FROM = process.env.AT_FROM || process.env.AFRICASTALKING_FROM;
const AT_DEFAULT_CC = process.env.AT_DEFAULT_CC || "+254";

export const smsClient = new AfricasTalkingSMS({
  username: AT_USERNAME,
  apiKey: AT_API_KEY,
  from: AT_FROM,
  defaultCountryCode: AT_DEFAULT_CC,
});

export const sendSms = (input: SendSmsInput) => smsClient.sendSms(input);
export const sendOtp = (input: SendOtpInput) => smsClient.sendOtp(input);
export const verifyOtp = (input: VerifyOtpInput) => smsClient.verifyOtp(input);

// ---- Express route helpers (optional) ------------------------------------
// You can plug these into your existing routes.ts

import type { Request, Response } from "express";

export const sendOtpHandler = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body as { phoneNumber?: string };
    if (!phoneNumber) return res.status(400).json({ message: "phoneNumber is required" });

    const { to, expiresAt } = await sendOtp({ to: phoneNumber });
    return res.json({ success: true, to, expiresAt });
  } catch (err: any) {
    console.error("sendOtp error", err);
    return res.status(500).json({ message: err?.message || "Failed to send OTP" });
  }
};

export const verifyOtpHandler = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, otp } = req.body as { phoneNumber?: string; otp?: string };
    if (!phoneNumber || !otp) return res.status(400).json({ message: "phoneNumber and otp are required" });

    const ok = await verifyOtp({ to: phoneNumber, otp });
    if (!ok) return res.status(400).json({ message: "Invalid or expired code" });

    return res.json({ success: true });
  } catch (err: any) {
    console.error("verifyOtp error", err);
    return res.status(500).json({ message: err?.message || "Failed to verify OTP" });
  }
};
