const nodemailer = require("nodemailer");
const config = require("../config");

let transporter = null;

const hasMailerConfig = () =>
  Boolean(config.smtpHost && config.smtpPort && config.smtpFrom);

const getTransporter = () => {
  if (!hasMailerConfig()) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth:
        config.smtpUser && config.smtpPass
          ? {
              user: config.smtpUser,
              pass: config.smtpPass
            }
          : undefined
    });
  }
  return transporter;
};

const sendCommentNotification = async ({
  toEmail,
  creatorUsername,
  eventId,
  eventTitle,
  commenterUsername,
  commentBody
}) => {
  const mailer = getTransporter();
  if (!mailer || !toEmail) {
    return { sent: false, skipped: true };
  }

  const eventUrl = `${config.frontendUrl}/events/${eventId}`;
  await mailer.sendMail({
    from: config.smtpFrom,
    to: toEmail,
    subject: `New comment on "${eventTitle}"`,
    text: `Hi ${creatorUsername || "there"},\n\n${commenterUsername || "Someone"} commented on your event "${eventTitle}".\n\nComment:\n${commentBody}\n\nView event: ${eventUrl}\n`,
    html: `<p>Hi ${creatorUsername || "there"},</p>
<p><strong>${commenterUsername || "Someone"}</strong> commented on your event <strong>${eventTitle}</strong>.</p>
<p><em>${commentBody}</em></p>
<p><a href="${eventUrl}">View event</a></p>`
  });

  return { sent: true };
};

module.exports = {
  sendCommentNotification
};
