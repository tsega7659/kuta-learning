import { Resend } from "resend";

const getResendClient = () => {
    const apiKey = (process.env.RESEND_API_KEY || process.env.RESEND_API_Key || process.env.resend_api_key || "").trim();
    if (!apiKey) return null;
    return new Resend(apiKey);
};


export const sendOtpEmail = async ({ to, otp, purpose = "Password Reset" }) => {
    const resend = getResendClient();

    if (!resend) {
        console.log("\n=======================================================");
        console.log(`🔑 [OTP DEV MODE] No RESEND_API_KEY set.`);
        console.log(`📧 Target Email: ${to}`);
        console.log(`🔐 Purpose: ${purpose}`);
        console.log(`👉 OTP Code: ${otp}`);
        console.log("=======================================================\n");
        return { success: true, devMode: true };
    }

    const fromAddress = process.env.EMAIL_FROM || "Kuta Learning <onboarding@resend.dev>";

    try {
        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: [to],
            subject: `Your ${purpose} OTP Code: ${otp}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #eef2f6; border-radius: 20px; box-shadow: 0 4px 18px rgba(12, 59, 107, 0.06);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #0c3b6b; font-size: 26px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">KUTA LEARNING</h1>
                        <p style="color: #f26522; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Security Verification</p>
                    </div>

                    <div style="text-align: center; margin-bottom: 24px;">
                        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">
                            You requested an OTP for <strong>${purpose}</strong>. Please enter the verification code below:
                        </p>
                    </div>

                    <div style="background: linear-gradient(135deg, #fef6ee 0%, #edf4ff 100%); border: 2px dashed #f26522; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0c3b6b; font-family: monospace;">${otp}</span>
                    </div>

                    <p style="font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0 0 16px 0;">
                        ⏱️ This verification code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
                    </p>

                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />

                    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                        If you did not request this code, you can safely ignore this email.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            throw new Error(error.message || "Failed to send OTP email via Resend");
        }

        return { success: true, data };
    } catch (err) {
        console.error("Failed to send OTP email:", err);
        throw err;
    }
};
