// backend/auth-service/src/utils/email.ts
/*import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
    console.log(`[DEBUG] Sending OTP to ${to}: ${otp}`);
    try {
        const info = await transporter.sendMail({
            from: `"Auth Service" <${SMTP_USER || 'no-reply@auth.local'}>`,
            to,
            subject: 'Your OTP Code',
            html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
        });
        console.log('[DEBUG] Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('[ERROR] Failed to send OTP email:', error);
        return false;
    }
}*/


import nodemailer from "nodemailer";
const USER_FROM = process.env.MAIL_USER || "noreply@invalidMailNoSet.fr";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
 },
});



export const sendOtpEmail = async (to:string,code:string) => {
	try {
		const mailOptions = {
		  from: `Transcendence<${USER_FROM}>`,
			to: to,
			subject: 'Votre code de connexion',
			text: `Voici votre code de sécurité : ${code}`,
			html: `<p>Voici votre code de sécurité : <b>${code}</b></p>`,
		};
		const info = await transporter.sendMail(mailOptions)
		console.log('📤 Message envoyé:', info.messageId);
	}
	catch (err) {
		console.log(err);

	}
}


