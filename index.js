'use strict';

const port = 8010;
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const buildSchemas = require('./src/schemas');
const PromisifyDB = require('./src/promisify_db');

db.serialize(() => {
    buildSchemas(db);

    const promisifyDB = new PromisifyDB({db});
    const app = require('./src/app')(promisifyDB);

    app.listen(port, () => console.log(`App started and listening on port ${port}`));
});
