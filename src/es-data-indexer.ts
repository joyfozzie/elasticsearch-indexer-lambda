
import { Client } from 'elasticsearch'
import { interval, Subscription } from 'rxjs';
import { bufferCount } from 'rxjs/operators';

import { IDataProvider } from './data-provider'

/**
 * Configuration options that need to be specified for el
 */
export interface IndexConfig {
    readonly name: string
    readonly type: string
    readonly mappings: Array<object>
}

/**
 * Contains the elasticsearch life-cycle and indexing methods
 */
export class ElasticsearchDataIndexer {

    private readonly es: Client
    private readonly indexConfig: IndexConfig
    private readonly dataProvider: IDataProvider

    private readonly indexBufferSize: number = 50

    constructor(
        indexConfig: IndexConfig,
        es: Client,
        dataProvider: IDataProvider) {

        this.es = es
        this.indexConfig = indexConfig
        this.dataProvider = dataProvider
    }

    public async createIndex(): Promise<any> {
        let result = await this.createIndexWithName()
        console.log('created index with result: ' + result)
        await this.createIndexMappings()
    }

    private createIndexWithName(): Promise<any> {
        let indexOptions = { index: this.indexConfig.name }
        console.log('creating index with config: ' + JSON.stringify(indexOptions))
        return this.es.indices.create(indexOptions)
    }

    private async createIndexMappings(): Promise<any> {
        for (let mapping of this.indexConfig.mappings) {
            await this.es.indices.putMapping({ 
                index: this.indexConfig.name,
                type: this.indexConfig.type,
                body: mapping
            })
            console.log('created index mapping: ' + mapping)
        }
    }

    public deleteIndex(): Promise<any> {
        let indexOptions = { index: this.indexConfig.name }
        return this.es.indices.delete(indexOptions)
    }

    public async index(): Promise<number> {

        let preCount = 0
        let postCount = 0
        let observableFinished = false
        let completion: Subscription = null

        let indexJob = new Promise<number>((resolve, _) => {


            // Subscribe to the document stream from the data provider. Buffer items for efficient indexing in elasticsearch
            this.dataProvider.get().pipe(bufferCount(this.indexBufferSize)).subscribe(
                async documents => {
                    preCount += documents.length

                    // For bulk inserts, es expects an action/document pair
                    let action = JSON.stringify( { index: { _index: this.indexConfig.name, _type: this.indexConfig.type } } )
                    let bulkIndex: Array<any> = []

                    for (let document of documents) {
                        bulkIndex.push(action)
                        bulkIndex.push(document)
                    }

                    try {
                        const response = await this.es.bulk( { body: bulkIndex } )
                        console.log(response)
                    }
                    catch (err) {
                        console.log(err)
                    }
    
                    postCount += documents.length
                },
                error => console.log(error),
                () => observableFinished = true )

                // I'm not a huge fan of this work-around. The problem is that the observable completes before the es.index async callbacks finish. 
                // This means that function exits with tasks still completing. This isn't a huge problem when the function is long-running. Since
                // this is going to be running in lambda, we don't want to leave trailing tasks around after execution, or we risk not indexing everything
                // we think we are.
                completion = interval(10).subscribe(_ => {
                    if (observableFinished && preCount === postCount) {
                        resolve(postCount)
                    }
                })
        })

        // cleanup the completion observable and return the number of documents indexed.
        const result = await indexJob
        completion.unsubscribe()
        return result
    }
}