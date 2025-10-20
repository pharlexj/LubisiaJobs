// SMS Service Configuration
// Supports multiple SMS providers: Africa's Talking, Twilio, etc.

// Load environment variables
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'africastalking'; // 'africastalking' or 'twilio'
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_USERNAME = process.env.SMS_USERNAME || '';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'TNPSB';

// Africa's Talking configuration
let africastalking: any = null;
if (SMS_PROVIDER === 'africastalking' && SMS_API_KEY && SMS_USERNAME) {
  try {
    const AfricasTalking = require('africastalking');
    africastalking = AfricasTalking({
      apiKey: SMS_API_KEY,
      username: SMS_USERNAME,
    });
  } catch (error) {
    console.error('Failed to initialize Africa\'s Talking:', error);
  }
}

export async function sendSms(phoneNumber: string, message: string): Promise<{success: boolean; error?: string; messageId?: string}> {
  try {
    // Check if SMS service is configured
    if (!SMS_API_KEY || !SMS_USERNAME) {
      console.warn('SMS service not configured. Set SMS_API_KEY and SMS_USERNAME environment variables.');
      return {
        success: false,
        error: 'SMS service not configured. Please add SMS_API_KEY, SMS_USERNAME, and SMS_SENDER_ID in Secrets.',
      };
    }

    // Format phone number (ensure it has country code for Kenya)
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+254' + formattedPhone;
    }

    // Send SMS based on provider
    if (SMS_PROVIDER === 'africastalking' && africastalking) {
      const sms = africastalking.SMS;
      const result = await sms.send({
        to: [formattedPhone],
        message,
        from: SMS_SENDER_ID,
      });

      if (result.SMSMessageData.Recipients.length > 0) {
        const recipient = result.SMSMessageData.Recipients[0];
        if (recipient.status === 'Success') {
          console.log(`SMS sent successfully to ${formattedPhone}:`, recipient.messageId);
          return {
            success: true,
            messageId: recipient.messageId,
          };
        } else {
          console.error(`Failed to send SMS to ${formattedPhone}:`, recipient.status);
          return {
            success: false,
            error: `Failed to send SMS: ${recipient.status}`,
          };
        }
      }
    } else if (SMS_PROVIDER === 'twilio') {
      // Twilio implementation (placeholder)
      const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
      const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
      const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        return {
          success: false,
          error: 'Twilio not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Secrets.',
        };
      }

      // You would need to install and use twilio package here
      console.log(`Would send SMS via Twilio to ${formattedPhone}: ${message}`);
      return {
        success: false,
        error: 'Twilio integration not yet implemented. Please install and configure Twilio SDK.',
      };
    } else {
      // Development mode - just log
      console.log(`[DEV MODE] Would send SMS to ${formattedPhone}: ${message}`);
      return {
        success: true,
        messageId: 'dev-' + Date.now(),
      };
    }

    return {
      success: false,
      error: 'Unknown error occurred',
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

// Send SMS to multiple recipients
export async function sendBulkSms(phoneNumbers: string[], message: string): Promise<{success: boolean; sentCount: number; failedCount: number; errors?: string[]}> {
  const results = [];
  const errors: string[] = [];
  
  for (const phoneNumber of phoneNumbers) {
    const result = await sendSms(phoneNumber, message);
    results.push(result);
    if (!result.success && result.error) {
      errors.push(`${phoneNumber}: ${result.error}`);
    }
  }

  const sentCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;

  return {
    success: sentCount > 0,
    sentCount,
    failedCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}
