'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const endpoints = require('./endpoints');

module.exports = (db) => {
    app.get('/health', endpoints.healthGetHandler);

    app.post('/rides', jsonParser, endpoints.ridesPostHandler.bind(null, db));

    app.get('/rides', endpoints.ridesGetHandler.bind(null, db));

    app.get('/rides/:id', endpoints.ridesGetByIdHandler.bind(null, db));

    return app;
};
