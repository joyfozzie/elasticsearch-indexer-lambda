import { Observable } from "rxjs";

import { IDataProvider } from "./data-provider";
import { Client } from 'pg'

let format = require('pg-format')
let Query = require('pg').Query

/**
 * Streams a S3 file back to the caller line-by-line.
 */
export class AuroraDataProvider implements IDataProvider {

    private pg: Client

    constructor(pg: Client) {
        this.pg = pg
    }

    public async seedTable() {

        try {
            await this.pg.connect()

            await this.pg.query('DROP TABLE IF EXISTS data')
            await this.pg.query('CREATE TABLE IF NOT EXISTS data(id SERIAL PRIMARY KEY, text varchar(3000))');
    
            // create a record that is roughly the size of the expected record size
            let text = ''
            for (let i = 0; i < 3000; i++)
                text += 'a'

            let id = 0

            for (let i = 0; i < 100; i++) {
                let records = new Array<Array<any>>()
                for (let j = 0; j < 100; j++)
                    records.push([id++, text])
    
                await this.pg.query(format('INSERT INTO data(id, text) VALUES %L', records))
                console.log('finished inserting ' + id + ' records')
            }
            
    
            const result = await this.pg.query('SELECT * FROM data ORDER BY id ASC');
            console.log(result)

            await this.pg.end()
        }
        catch (err) {
            console.log(err)
            await this.pg.end()
        }
    }

    public get(): Observable<string> {

        return Observable.create(async observer => {
            await this.pg.connect()

            let query = new Query('SELECT * FROM data ORDER BY id ASC')
            let result = this.pg.query(query)
            result.on('row', row => {
                observer.next(JSON.stringify(row))
            })
            result.on('end', async () => {
                observer.complete()
                await this.pg.end()
            })
        })
    }
}