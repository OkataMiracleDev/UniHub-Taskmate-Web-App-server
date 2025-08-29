// netlify/functions/api.js
const serverless = require("serverless-http");
const app = require("../../server.js"); // adjust relative path

module.exports.handler = serverless(app);
