"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const readline = require("readline");
const aws_sdk_1 = require("aws-sdk");
/**
 * Streams a S3 file back to the caller line-by-line.
 */
class S3DataProvider {
    constructor(region, bucket, key) {
        this.bucket = bucket;
        this.key = key;
        this.s3 = new aws_sdk_1.S3({ region: region });
    }
    get() {
        return rxjs_1.Observable.create(observer => {
            let s3ReadStream = this.s3.getObject({ Bucket: this.bucket, Key: this.key }).createReadStream();
            let readlineStream = readline.createInterface({ input: s3ReadStream, terminal: false });
            readlineStream.on('line', line => {
                observer.next(line);
            });
            readlineStream.on('close', () => {
                observer.complete();
            });
        });
    }
}
exports.S3DataProvider = S3DataProvider;
//# sourceMappingURL=s3-data-provider.js.map