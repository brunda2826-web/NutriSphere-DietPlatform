import nodemailer from "nodemailer";

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS are required");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Common email sender
export async function sendEmail({ to, subject, text, html }) {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"NutriSphere" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent successfully:", info.messageId);

    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
}

// OTP email
export const sendOtpEmail = async (to, otp) => {
  return sendEmail({
    to,
    subject: "Your NutriSphere verification code",
    text: `Your NutriSphere OTP is ${otp}. This code expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #245c45;">NutriSphere</h2>

        <p>Your verification code is:</p>

        <h1 style="
          letter-spacing: 8px;
          color: #245c45;
          font-size: 32px;
        ">
          ${otp}
        </h1>

        <p>This OTP expires in 10 minutes.</p>

        <p>
          If you did not create a NutriSphere account,
          you can safely ignore this email.
        </p>
      </div>
    `,
  });
};
