'use strict';

const request = require('supertest');
const assert = require('assert');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const PromisifyDB = require('../src/promisify_db');
const promisifyDB = new PromisifyDB({db});
const app = require('../src/app')(promisifyDB);
const buildSchemas = require('../src/schemas');

describe('API tests', () => {
    let ridePayload;

    before((done) => {
        db.serialize((err) => { 
            if (err) {
                return done(err);
            }

            buildSchemas(db);

            done();
        });
    });

    beforeEach((done) => {
        ridePayload = {
            start_lat: 20,
            start_long: 100,
            end_lat: 20,
            end_long: 100,
            rider_name: 'John',
            driver_name: 'Victor',
            driver_vehicle: 'Volvo'
        }

        // Clean the records
        db.all('DELETE FROM Rides', () => {
            // Reset the autoincrement rideID
            db.all('DELETE FROM SQLITE_SEQUENCE where name=\'Rides\'', () => {
                done()
            });
        });
    })

    describe('GET /health', () => {
        it('should return health', async () => {
            await request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200);
        });
    });

    describe('POST /rides', () => {
        it('should return the correct response', async () => {
            await request(app)
                .post('/rides')
                .send(ridePayload)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    assert.equal(response.body.length, 1);
                    const {rideID, created, ...rest} = response.body[0];
                    assert.deepEqual(rest, {
                        driverName: "Victor",
                        driverVehicle: "Volvo",
                        endLat: 20,
                        endLong: 100,
                        riderName: "John",
                        startLat: 20,
                        startLong: 100
                    });
                });
        });

        it('should return validation error if the start latitude is invalid', async () => {
            ridePayload.start_lat = -91;
            await request(app)
                .post('/rides')
                .send(ridePayload)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should return validation error if the end latitude is invalid', async () => {
            ridePayload.end_lat = -91;
            await request(app)
                .post('/rides')
                .send(ridePayload)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should return validation error when the rider name is invalid', async () => {
            ridePayload.rider_name = '';
            await request(app)
                .post('/rides')
                .send(ridePayload)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should return validation error when the diver name is invalid', async () => {
            ridePayload.driver_name = '';
            await request(app)
                .post('/rides')
                .send(ridePayload)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should return validation error when the driver vehicle is invalid', async () => {
            ridePayload.driver_vehicle = '';
            await request(app)
                .post('/rides')
                .send(ridePayload)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(response => {
                    assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                });
        });
    });

    describe('GET /rides', () => {
        it('should return error if there is no rides', async () => {
            await request(app)
                .get('/rides')
                .expect('Content-Type', /application\/json/)
                .expect(200)
                .then(response => {
                    assert.equal(response.body.error_code, 'RIDES_NOT_FOUND_ERROR');
                });
        });

        it('should return all available rides', async () => {
            const addRide = request(app)
                .post('/rides')
                .send(ridePayload);

            const addRide2 = request(app)
                .post('/rides')
                .send(ridePayload);

            const [res1, res2] = await Promise.all([addRide, addRide2]);

            if (res1.body.error_code || res2.body.error_code) {
                throw new Error(res1.body.error_code || res2.body.error_code);
            }

            await request(app)
                .get('/rides')
                .expect('Content-Type', /application\/json/)
                .expect(200)
                .then(response => {
                    assert.equal(response.body.length, 2);
                });
        });
    });

    describe('GET /rides with queries', () => {
        it('should support pagination', async () => {
            const addRide = request(app)
                .post('/rides')
                .send(ridePayload);

            const addRide2 = request(app)
                .post('/rides')
                .send(ridePayload);

            const addRide3 = request(app)
                .post('/rides')
                .send(ridePayload);

            const [res1, res2, res3] = await Promise.all([addRide, addRide2, addRide3]);

            if (res1.body.error_code || res2.body.error_code || res3.body.error_code) {
                reject(res1.body.error_code || res2.body.error_code || res3.body.error_code);
            }

            await request(app)
                .get('/rides?from=1&count=1')
                .then(response => {
                    assert.equal(response.body.length, 1);
                    const {created, ...rest} = response.body[0];
                    assert.deepEqual(rest, {
                        rideID: '2',
                        driverName: "Victor",
                        driverVehicle: "Volvo",
                        endLat: 20,
                        endLong: 100,
                        riderName: "John",
                        startLat: 20,
                        startLong: 100
                    });
                })
        });

        it('should return validation error if the given query is invalid', async () => {
            await request(app)
                .get('/rides?from=1.1&count=-2')
                .then(response => {
                    assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                });
        });
    });

    describe('GET /rides/:id', () => {
        it('should return error if there is no rides', async () => {
            await request(app)
                .get('/rides/1')
                .expect('Content-Type', /application\/json/)
                .expect(200)
                .then(response => {
                    assert.equal(response.body.error_code, 'RIDES_NOT_FOUND_ERROR');
                });
        });

        it('should return all available rides', async () => {
            await request(app)
                .post('/rides')
                .send(ridePayload)
                .then((res) => {
                    if (res.body.error_code) {
                        reject(res.body.error_code);
                    }

                    return request(app)
                        .get(`/rides/${res.body[0].rideID}`);
                })
                .then(response => {
                    assert.equal(response.body.length, 1);
                    const {rideID, created, ...rest} = response.body[0];
                    assert.deepEqual(rest, {
                        driverName: "Victor",
                        driverVehicle: "Volvo",
                        endLat: 20,
                        endLong: 100,
                        riderName: "John",
                        startLat: 20,
                        startLong: 100
                    });
                })
        });
    });
});
