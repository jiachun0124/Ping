const config = require("./config");
const { createApp } = require("./app");

const start = async () => {
  const app = await createApp();
  app.listen(config.port, config.host, () => {
    console.log(`Ping backend listening on http://${config.host}:${config.port}`);
    const emailNotificationsEnabled = Boolean(
      config.smtpHost && config.smtpPort && config.smtpFrom
    );
    console.log(
      `Email notifications: ${emailNotificationsEnabled ? "enabled" : "disabled"}`
    );
  });
};

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
