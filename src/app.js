'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const endpoints = require('./endpoints');
const logger = require('./logger')();

// Very simple implementation logger middleware
function errorLoggerMiddleware(req, res, next) {
    const originalSend = res.send;
    res.send = function(data) {
        // Currently only log the response that has error_code
        if (data.error_code) {
            logger.error(`${req.method} ${req.url} ${data.error_code} ${data.message}`);
        }
        res.send = originalSend;
        return res.send(data);
    }
    next();
}

module.exports = (db) => {
    app.use(errorLoggerMiddleware);

    app.get('/health', endpoints.healthGetHandler);

    app.post('/rides', jsonParser, endpoints.ridesPostHandler.bind(null, db));

    app.get('/rides', endpoints.ridesGetHandler.bind(null, db));

    app.get('/rides/:id', endpoints.ridesGetByIdHandler.bind(null, db));

    return app;
};
