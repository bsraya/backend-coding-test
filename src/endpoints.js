/**
 * Handler for health endpoint.
 * 
 * @param {Object} req - The client request.
 * @param {Object} res - The server response.
 */
function healthGetHandler(req, res) {
    res.send('Healthy');
}

/**
 * Handler for POST rides endpoint.
 * 
 * @param {Object} db - The database.
 * @param {Object} req - The client request.
 * @param {Object} req.body - The client request body.
 * @param {Number} req.body.start_lat - The latitude where the ride started. A number range [-90 90].
 * @param {Number} req.body.start_long - The longitute where the ride started. A number range [-180 180].
 * @param {Number} req.body.end_lat - The latitude where the ride ended. A number range [-90 90]
 * @param {Number} req.body.end_long - The longitute where the ride ended. A number range [-180 180]
 * @param {String} req.body.rider_name - The rider name. A non-empty string.
 * @param {String} req.body.driver_name - The driver name. A non-empty string.
 * @param {String} req.body.driver_vehicle - The driver vehicle. A non-empty string.
 */
function ridesPostHandler(db, req, res) {
    const startLatitude = Number(req.body.start_lat);
    const startLongitude = Number(req.body.start_long);
    const endLatitude = Number(req.body.end_lat);
    const endLongitude = Number(req.body.end_long);
    const riderName = req.body.rider_name;
    const driverName = req.body.driver_name;
    const driverVehicle = req.body.driver_vehicle;

    if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
        return res.send({
            error_code: 'VALIDATION_ERROR',
            message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
        });
    }

    if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
        return res.send({
            error_code: 'VALIDATION_ERROR',
            message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
        });
    }

    if (typeof riderName !== 'string' || riderName.length < 1) {
        return res.send({
            error_code: 'VALIDATION_ERROR',
            message: 'Rider name must be a non empty string'
        });
    }

    if (typeof driverName !== 'string' || driverName.length < 1) {
        return res.send({
            error_code: 'VALIDATION_ERROR',
            message: 'Driver name must be a non empty string'
        });
    }

    if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
        return res.send({
            error_code: 'VALIDATION_ERROR',
            message: 'Driver vehicle must be a non empty string'
        });
    }

    var values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long, req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];
    
    db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, function (err) {
        if (err) {
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }

        db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, function (err, rows) {
            if (err) {
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            res.send(rows);
        });
    });
}

/**
 * Handler for GET rides endpoint.
 * 
 * @param {Object} db - The database.
 * @param {Object} req - The client request.
 * @param {Number} [req.query.from=0] - The offset of the requested rides.
 * @param {Number} [req.query.count=10] - The number of the requested rides.
 * @param {Object} res - The client response.
 */
function ridesGetHandler(db, req, res) {
    const from = req.query.from ? Number(req.query.from) : 0;
    const count = req.query.count ? Number(req.query.count) : 10;

    if (!Number.isInteger(from) || !Number.isInteger(count)) {
        return res.send({
            error_code: 'VALIDATION_ERROR',
            message: 'The `from` or `count` must an integer larger or equal to 0'
        });
    }

    db.all('SELECT * FROM Rides LIMIT ?,?', from, count, function (err, rows) {
        if (err) {
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }

        if (rows.length === 0) {
            return res.send({
                error_code: 'RIDES_NOT_FOUND_ERROR',
                message: 'Could not find any rides'
            });
        }

        res.send(rows);
    });
}

/**
 * Handler for GET rides endpoint with specify id.
 * 
 * @param {Object} db - The database.
 * @param {Object} req - The client request.
 * @param {Object} req.params.id - The requested ride id.
 * @param {Object} res - The client response.
 */
function ridesGetByIdHandler(db, req, res) {
    db.all(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`, function (err, rows) {
        if (err) {
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }

        if (rows.length === 0) {
            return res.send({
                error_code: 'RIDES_NOT_FOUND_ERROR',
                message: 'Could not find any rides'
            });
        }

        res.send(rows);
    });
}

module.exports = {
    healthGetHandler,
    ridesPostHandler,
    ridesGetHandler,
    ridesGetByIdHandler
};
