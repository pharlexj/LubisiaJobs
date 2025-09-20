/**
 * Client-side SMS API Wrapper (TypeScript)
 * ----------------------------------------
 * Secure client-side wrapper that makes API calls to the server.
 * All SMS functionality is handled server-side for security.
 *
 * Usage:
 *   import { sendOtp, verifyOtp } from "./africastalking-sms";
 *
 *   const result = await sendOtp({ phoneNumber: "+2547XXXXXXXX" });
 *   const verified = await verifyOtp({ phoneNumber: "+2547XXXXXXXX", code: "123456" });
 */

// Client-side interface definitions
export interface SendOtpRequest {
  phoneNumber: string;
  purpose?: 'authentication' | 'password-reset' | 'phone-verification';
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  code: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

/** Phone number normalization helper (client-side utility) */
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

/** Make API request helper */
const apiCall = async (endpoint: string, data: any): Promise<ApiResponse> => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include session cookies
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return await response.json();
};

/**
 * Send OTP via server API call
 */
export const sendOtp = async (request: SendOtpRequest): Promise<ApiResponse> => {
  return await apiCall('/api/auth/send-otp', request);
};

/**
 * Verify OTP via server API call
 */
export const verifyOtp = async (request: VerifyOtpRequest): Promise<ApiResponse> => {
  return await apiCall('/api/auth/verify-otp', request);
};

// Legacy handlers for backward compatibility (redirect to server API calls)
export const sendOtpHandler = async (req: any, res: any) => {
  console.warn('sendOtpHandler called on client-side - this should be handled server-side');
  res.status(500).json({ message: 'This functionality has been moved to server-side for security' });
};

export const verifyOtpHandler = async (req: any, res: any) => {
  console.warn('verifyOtpHandler called on client-side - this should be handled server-side');
  res.status(500).json({ message: 'This functionality has been moved to server-side for security' });
};

// Export for components that might use these for simple phone validation
export { normalizePhone as normalizePhoneNumber };