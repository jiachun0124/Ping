const serverless = require("serverless-http");
const { createApp } = require("./app");

let handler;

module.exports.handler = async (event, context) => {
  if (!handler) {
    const app = await createApp();
    handler = serverless(app);
  }
  return handler(event, context);
};

