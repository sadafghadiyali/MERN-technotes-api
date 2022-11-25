const { logEvent } = require("./logger");

const errorHandler = (err, req, res, next) => {
  const errorMesage = `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`;
  logEvent(errorMesage, "errorLog.log");
  console.log(err.stack);

  const status = res.statusCode ? res.statusStatusCode : 500; //server error;

  res.status(status);

  res.json({ message: err.message, isError: true });
};

module.exports = errorHandler;
