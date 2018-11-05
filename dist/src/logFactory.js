"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const { combine, timestamp, printf } = winston_1.format;
const myFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});
exports.getLogger = label => {
    return winston_1.createLogger({
        format: combine(label, timestamp(), myFormat),
        transports: [new winston_1.transports.Console()]
    });
};
//# sourceMappingURL=logFactory.js.map