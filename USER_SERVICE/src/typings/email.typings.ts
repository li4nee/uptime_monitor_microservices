export const emailVerificationOtpMailTemplate = (name: string, otp: string): string => {
    return `
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0;">
                <div style="max-width: 480px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 32px;">
                    <h1 style="color: #333; font-size: 24px; margin-bottom: 16px;">Hello ${name},</h1>
                    <p style="font-size: 16px; color: #555; margin-bottom: 24px;">
                        Thank you for registering with us. Please verify your email address using the OTP below:
                    </p>
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="display: inline-block; background: #f0f4ff; color: #2a4dff; font-size: 32px; letter-spacing: 8px; padding: 16px 32px; border-radius: 8px; font-weight: bold;">
                            ${otp}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: #888; margin-bottom: 24px;">
                        If you did not create an account, please ignore this email.
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        Best regards,<br>Your Team
                    </p>
                </div>
            </body>
        </html>
    `;
}