const rateLimit = require("express-rate-limit");
const logEvents = require("./logger");

const loginLimitter = rateLimit({
  windowMs: 60 * 1000, //1 minute
  max: 5, //Limit each IP to 5 requests per `window` (here, per 1 minutes)
  message: {
    message:
      "Too many login attempts from this IP, please try again after a 60 second pause",
  },
  handler: (req, res, next, options) => {
    //Express request handler that sends back a response when a client is rate-limited.
    logEvents(
      `Too Many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      "errLog.log"
    );
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, //Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = loginLimitter;
