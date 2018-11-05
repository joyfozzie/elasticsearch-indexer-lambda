"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const { combine, timestamp, label, printf } = winston_1.format;
const myFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level} - ${info.message}`;
});
module.exports = function (fileName) {
    return winston_1.createLogger({
        format: combine(timestamp(), label({ label: fileName }), myFormat),
        transports: [new winston_1.transports.Console({
                level: process.env.STAGE === 'PROD' ? 'error' : 'debug'
            })]
    });
};
