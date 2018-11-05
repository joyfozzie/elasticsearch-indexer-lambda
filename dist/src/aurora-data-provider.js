"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
let format = require('pg-format');
let Query = require('pg').Query;
/**
 * Streams a S3 file back to the caller line-by-line.
 */
class AuroraDataProvider {
    constructor(pg) {
        this.pg = pg;
    }
    seedTable() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.pg.connect();
                yield this.pg.query('DROP TABLE IF EXISTS data');
                yield this.pg.query('CREATE TABLE IF NOT EXISTS data(id SERIAL PRIMARY KEY, text varchar(3000))');
                // create a record that is roughly the size of the expected record size
                let text = '';
                for (let i = 0; i < 3000; i++)
                    text += 'a';
                let id = 0;
                for (let i = 0; i < 100; i++) {
                    let records = new Array();
                    for (let j = 0; j < 100; j++)
                        records.push([id++, text]);
                    yield this.pg.query(format('INSERT INTO data(id, text) VALUES %L', records));
                    console.log('finished inserting ' + id + ' records');
                }
                const result = yield this.pg.query('SELECT * FROM data ORDER BY id ASC');
                console.log(result);
                yield this.pg.end();
            }
            catch (err) {
                console.log(err);
                yield this.pg.end();
            }
        });
    }
    get() {
        return rxjs_1.Observable.create((observer) => __awaiter(this, void 0, void 0, function* () {
            yield this.pg.connect();
            let query = new Query('SELECT * FROM data ORDER BY id ASC');
            let result = this.pg.query(query);
            result.on('row', row => {
                observer.next(JSON.stringify(row));
            });
            result.on('end', () => __awaiter(this, void 0, void 0, function* () {
                observer.complete();
                yield this.pg.end();
            }));
        }));
    }
}
exports.AuroraDataProvider = AuroraDataProvider;
//# sourceMappingURL=aurora-data-provider.js.map