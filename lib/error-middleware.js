'use strict';

const createError = require('http-errors');
const debug = require('debug')('cfgram:error-middleware');

module.exports = function(err, req, res, next) {
  debug('Error Middleware');

  console.error('message:', err.message);
  console.error('name:', err.name);

  if(err.status) {
    res.status(err.status).send(err.name);
    next();
    return;
  }

  if(err.name === 'ValidationError') {
    err = createError(404, err.message);
    res.status(err.status).send(err.name);
    next();
    return;
  }

  err = createError(500, err.message);
  res.status(err.status).send(err.name);
  next();
}