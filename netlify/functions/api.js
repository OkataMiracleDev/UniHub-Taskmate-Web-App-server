// netlify/functions/api.js
const serverless = require("serverless-http");
const app = require("./server.js"); // Updated path to the main server file in the same directory

module.exports.handler = serverless(app);