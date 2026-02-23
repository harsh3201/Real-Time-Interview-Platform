const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: `"InterviewHub" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Login OTP Code',
        text: `Your OTP for login is: ${otp}. It expires in 10 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #6366f1;">InterviewHub Login OTP</h2>
                <p>Use the following code to sign in to your account:</p>
                <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otp}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendOTP };
