const { createLogger, format, transports } = require("winston");

module.exports = function() {
    return createLogger({
        transports: [
            new transports.File({
                filename: "logs/server.log"
            })
        ],
        format: format.combine(
            format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
            format.align(),
            format.printf(
                (info) => `${[info.timestamp]}: ${info.level}: ${info.message}`
            )
        ),
    });
};
