import { Resend } from 'resend';

// Lazy initialize Resend client to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'alerts@stocktrackr.eu';
const APP_NAME = 'StockTrackr';

interface SendAlertEmailParams {
    to: string;
    userName: string;
    ticker: string;
    currentPrice: number;
    targetPrice: number;
    alertType: 'above' | 'below';
    stockName?: string;
}

export async function sendPriceAlertEmail({
    to,
    userName,
    ticker,
    currentPrice,
    targetPrice,
    alertType,
    stockName,
}: SendAlertEmailParams): Promise<{ success: boolean; error?: string }> {
    const direction = alertType === 'above' ? 'risen above' : 'dropped below';
    const emoji = alertType === 'above' ? '📈' : '📉';

    try {
        const { data, error } = await getResendClient().emails.send({
            from: `${APP_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject: `${emoji} Price Alert: ${ticker} has ${direction} $${targetPrice.toFixed(2)}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Price Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
            <td>
                <!-- Header -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                    <tr>
                        <td style="text-align: center;">
                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0;">
                                ${APP_NAME}
                            </h1>
                        </td>
                    </tr>
                </table>
                
                <!-- Alert Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 24px; overflow: hidden;">
                    <tr>
                        <td style="padding: 32px;">
                            <!-- Emoji Badge -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <span style="font-size: 48px;">${emoji}</span>
                            </div>
                            
                            <!-- Alert Title -->
                            <h2 style="color: #ffffff; font-size: 28px; font-weight: 900; text-align: center; margin: 0 0 16px 0;">
                                Price Alert Triggered
                            </h2>
                            
                            <p style="color: #a0aec0; font-size: 16px; text-align: center; margin: 0 0 32px 0;">
                                Hi ${userName}, your price alert for <strong style="color: #ffffff;">${ticker}</strong> has been triggered.
                            </p>
                            
                            <!-- Stock Info -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.05); border-radius: 16px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table width="100%">
                                            <tr>
                                                <td style="width: 50%; padding: 8px;">
                                                    <p style="color: #a0aec0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Ticker</p>
                                                    <p style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0;">${ticker}</p>
                                                    ${stockName ? `<p style="color: #a0aec0; font-size: 12px; margin: 4px 0 0 0;">${stockName}</p>` : ''}
                                                </td>
                                                <td style="width: 50%; padding: 8px; text-align: right;">
                                                    <p style="color: #a0aec0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Current Price</p>
                                                    <p style="color: ${alertType === 'above' ? '#10b981' : '#ef4444'}; font-size: 24px; font-weight: 900; margin: 0;">$${currentPrice.toFixed(2)}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alert Details -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 16px; background-color: ${alertType === 'above' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border-radius: 12px; border-left: 4px solid ${alertType === 'above' ? '#10b981' : '#ef4444'};">
                                        <p style="color: #ffffff; font-size: 14px; margin: 0;">
                                            <strong>${ticker}</strong> has ${direction} your target price of <strong>$${targetPrice.toFixed(2)}</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://stocktrackr.eu'}/dashboard/ticker/${ticker}" 
                                           style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 14px;">
                                            View ${ticker} Details →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                    <tr>
                        <td style="text-align: center; padding: 24px;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
                                This alert was automatically sent by ${APP_NAME}
                            </p>
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://stocktrackr.eu'}/dashboard/alerts" style="color: #3b82f6; text-decoration: none;">
                                    Manage your alerts
                                </a>
                                 • 
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://stocktrackr.eu'}/dashboard/account" style="color: #3b82f6; text-decoration: none;">
                                    Email preferences
                                </a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        });

        if (error) {
            console.error('Failed to send alert email:', error);
            return { success: false, error: error.message };
        }

        console.log('Alert email sent successfully:', data?.id);
        return { success: true };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: 'Failed to send email' };
    }
}

interface SendWelcomeEmailParams {
    to: string;
    userName: string;
}

export async function sendWelcomeEmail({
    to,
    userName,
}: SendWelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
        const { data, error } = await getResendClient().emails.send({
            from: `${APP_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject: `🎉 Welcome to ${APP_NAME}!`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
            <td style="text-align: center;">
                <h1 style="color: #ffffff; font-size: 32px; font-weight: 900; margin: 0 0 16px 0;">
                    Welcome to ${APP_NAME}! 🎉
                </h1>
                <p style="color: #a0aec0; font-size: 16px; margin: 0 0 32px 0;">
                    Hi ${userName}, we're excited to have you on board!
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 24px;">
                    <tr>
                        <td style="padding: 32px; text-align: left;">
                            <h2 style="color: #ffffff; margin: 0 0 16px 0;">Get Started:</h2>
                            <ul style="color: #a0aec0; padding-left: 20px;">
                                <li style="margin-bottom: 8px;">📊 Add your first trade</li>
                                <li style="margin-bottom: 8px;">⭐ Create a watchlist</li>
                                <li style="margin-bottom: 8px;">🔔 Set up price alerts</li>
                                <li style="margin-bottom: 8px;">📈 Track your performance</li>
                            </ul>
                        </td>
                    </tr>
                </table>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://stocktrackr.eu'}/dashboard" 
                   style="display: inline-block; margin-top: 32px; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 16px; font-weight: 700;">
                    Go to Dashboard →
                </a>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to send email' };
    }
}
