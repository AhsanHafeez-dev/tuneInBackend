import { WELCOME_TEMPLATE, EMAIL_VERIFY_TEMPLATE } from "./EmailTemplate.js";
import { transport } from "./EmailTransport.js";
const SendMail = async (to, subject, html, headers = {}) => {
  if (!headers) {
    headers = {
      "X-Priority": "3", // normal priority
      "X-Mailer": "NodeMailer", // custom mailer header
    };
  }

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    html,
    headers,
  };
  await transport.sendMail(mailOptions);
};

const sendRegistrationEmail = async (user) => {
  await SendMail(
    user.email,
    "Welcome Email",
    WELCOME_TEMPLATE.replaceAll("{{name}}", user.userName)
  );
};

export { sendRegistrationEmail };
