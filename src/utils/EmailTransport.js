import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ahsanhafeez883@gmail.com",
    pass: "teyv sauc trwe txam",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export { transport };
