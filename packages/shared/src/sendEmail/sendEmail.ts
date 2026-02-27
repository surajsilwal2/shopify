import nodemailer from "nodemailer";
import path from "path";
import ejs from "ejs";
import { fileURLToPath } from "url";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (name: string, to: string, otp: string) => {
  const _fileName = fileURLToPath(import.meta.url); // import.meta.url is a special variable that contains the URL of the current module, we use fileURLToPath to convert it to a file path, this is necessary because we need to resolve the path to the ejs template
  const _dirName = path.dirname(_fileName);
  const templatePath = path.resolve(_dirName, "otp.ejs");
  const html = await ejs.renderFile(templatePath, { name, otp });

  await transporter.sendMail({
    from: `"Shop Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP Code",
    html,
  });
};
