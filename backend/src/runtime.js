const mongoose = require("mongoose");
const { createClient } = require("redis");
const { RedisStore } = require("connect-redis");
const config = require("./config");

let mongoConnectPromise = null;
let redisClientPromise = null;
let redisStorePromise = null;

const connectMongo = async () => {
  if (!mongoConnectPromise) {
    mongoConnectPromise = mongoose.connect(config.mongoUri);
  }
  return mongoConnectPromise;
};

const getRedisClient = async () => {
  if (!config.redisUrl) {
    return null;
  }
  if (!redisClientPromise) {
    const client = createClient({
      url: config.redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
      }
    });
    client.on("error", (error) => {
      console.error("Redis client error", error);
    });
    redisClientPromise = client.connect().then(() => client);
  }
  return redisClientPromise;
};

const getSessionStore = async () => {
  if (!config.redisUrl) {
    if (config.isLambdaRuntime) {
      throw new Error("REDIS_URL is required for Lambda session storage");
    }
    return null;
  }
  if (!redisStorePromise) {
    redisStorePromise = getRedisClient().then(
      (client) =>
        new RedisStore({
          client,
          prefix: config.redisSessionPrefix,
          ttl: config.sessionTtlSeconds
        })
    );
  }
  return redisStorePromise;
};

module.exports = {
  connectMongo,
  getSessionStore
};

