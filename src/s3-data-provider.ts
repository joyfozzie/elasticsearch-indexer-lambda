import { Observable } from "rxjs";
import * as readline from "readline";
import { S3 } from 'aws-sdk'

import { IDataProvider } from "./data-provider";

/**
 * Streams a S3 file back to the caller line-by-line.
 */
export class S3DataProvider implements IDataProvider {

    private readonly bucket: string
    private readonly key: string
    private readonly s3: S3

    constructor(region: string, bucket: string, key: string) {
        this.bucket = bucket
        this.key = key
        this.s3 = new S3( { region: region } )
    }

    public get(): Observable<string> {

        return Observable.create(observer => {
            let s3ReadStream = this.s3.getObject( { Bucket: this.bucket, Key: this.key } ).createReadStream();
            let readlineStream = readline.createInterface( { input: s3ReadStream, terminal: false } );
            
            readlineStream.on('line', line => {
                observer.next(line)
            })
            readlineStream.on('close', () => {
                observer.complete()
            })
        })
    }
}