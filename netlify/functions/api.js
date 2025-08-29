// netlify/functions/api.js
const serverless = require("serverless-http");
const app = require("server.js"); // Adjust the path to your main server file

module.exports.handler = serverless(app);