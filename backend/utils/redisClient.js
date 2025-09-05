const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().then(() => {
  console.log('Redis client connected');
}).catch((err) => {
  console.error('Redis connection error:', err);
});

module.exports = redisClient;
