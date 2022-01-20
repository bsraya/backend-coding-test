'use strict';

const request = require('supertest');
const assert = require('assert');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
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
        db.all('DELETE FROM Rides', done);
    })

    describe('GET /health', () => {
        it('should return health', () => {
            return new Promise((resolve, reject) => {
                request(app)
                    .get('/health')
                    .expect('Content-Type', /text/)
                    .expect(200)
                    .then(resolve)
                    .catch(reject);
            });
        });
    });

    describe('POST /rides', () => {
        it('should return the correct response', () => {
            return new Promise((resolve, reject) => {
                request(app)
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
                        resolve();
                    })
                    .catch(reject);
            });
        });

        it('should return validation error if the start latitude is invalid', () => {
            ridePayload.start_lat = -91;
            return new Promise((resolve, reject) => {
                request(app)
                    .post('/rides')
                    .send(ridePayload)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then(response => {
                        assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                        resolve();
                    })
                    .catch(reject);
            });
        });

        it('should return validation error if the end latitude is invalid', () => {
            ridePayload.end_lat = -91;
            return new Promise((resolve, reject) => {
                request(app)
                    .post('/rides')
                    .send(ridePayload)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then(response => {
                        assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                        resolve();
                    })
                    .catch(reject);
            });
        });

        it('should return validation error when the rider name is invalid', () => {
            ridePayload.rider_name = '';
            return new Promise((resolve, reject) => {
                request(app)
                    .post('/rides')
                    .send(ridePayload)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then(response => {
                        assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                        resolve();
                    })
                    .catch(reject);
            });
        });

        it('should return validation error when the diver name is invalid', () => {
            ridePayload.driver_name = '';
            return new Promise((resolve, reject) => {
                request(app)
                    .post('/rides')
                    .send(ridePayload)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then(response => {
                        assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                        resolve();
                    })
                    .catch(reject);
            });
        });

        it('should return validation error when the driver vehicle is invalid', () => {
            ridePayload.driver_vehicle = '';
            return new Promise((resolve, reject) => {
                request(app)
                    .post('/rides')
                    .send(ridePayload)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then(response => {
                        assert.equal(response.body.error_code, 'VALIDATION_ERROR');
                        resolve();
                    })
                    .catch(reject);
            });
        });
    });

    describe('GET /rides', () => {
        it('should return error if there is no rides', () => {
            return new Promise((resolve, reject) => {
                request(app)
                    .get('/rides')
                    .expect('Content-Type', /application\/json/)
                    .expect(200)
                    .then(response => {
                        assert.equal(response.body.error_code, 'RIDES_NOT_FOUND_ERROR');
                        resolve();
                    })
                    .catch(reject);
            })
        });

        it('should all available rides', () => {
            return new Promise((resolve, reject) => {
                const addRide = request(app)
                    .post('/rides')
                    .send(ridePayload)
                    .catch(reject);
    
                const addRide2 = request(app)
                    .post('/rides')
                    .send(ridePayload)
                    .catch(reject);
                
                Promise.all([addRide, addRide2]).then(([res1, res2]) => {
                    if (res1.body.error_code || res2.body.error_code) {
                        reject(res1.body.error_code || res2.body.error_code);
                    }
    
                    request(app)
                        .get('/rides')
                        .expect('Content-Type', /application\/json/)
                        .expect(200)
                        .then(response => {
                            assert.equal(response.body.length, 2);
                            resolve();
                        })
                        .catch(reject);
                })
                .catch(reject);
            });
        });
    });

    describe('GET /rides/:id', () => {
        it('should return error if there is no rides', () => {
            return new Promise((resolve, reject) => {
                request(app)
                    .get('/rides/1')
                    .expect('Content-Type', /application\/json/)
                    .expect(200)
                    .then(response => {
                        assert.equal(response.body.error_code, 'RIDES_NOT_FOUND_ERROR');
                        resolve();
                    })
                    .catch(reject);
            })
        });

        it('should all available rides', () => {
            return new Promise((resolve, reject) => {
                request(app)
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
                        resolve();
                    })
                    .catch(reject);;
            });
        });
    });
});
