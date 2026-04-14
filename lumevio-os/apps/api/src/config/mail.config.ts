export default () => ({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  user: process.env.SMTP_USER,
});
