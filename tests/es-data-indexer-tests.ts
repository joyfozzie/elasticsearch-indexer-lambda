import { Client, IndicesCreateParams, Indices } from 'elasticsearch'
import { ReplaySubject } from 'rxjs'
import * as TypeMoq from 'typemoq'
import * as mocha from 'mocha'
let assert = require('assert')

import { IDataProvider } from '../src/data-provider'
import { ElasticsearchDataIndexer, IndexConfig } from '../src/es-data-indexer'

describe('ElasticsearchDataIndexer lifecycle methods', () => {
    
    let indexConfig: IndexConfig = {
        name: 'sampleName',
        type: 'sampleType',
        mappings: [{}]
    }
    
    let indices = TypeMoq.Mock.ofType<Indices>()
    let es = TypeMoq.Mock.ofType<Client>()
    es.setup(e => e.indices).returns(() => indices.object)
    
    let dataProvider = TypeMoq.Mock.ofType<IDataProvider>()

    let esIndexer = new ElasticsearchDataIndexer(indexConfig, es.object, dataProvider.object)

    it ('createIndex', async () => {

        await esIndexer.createIndex()

        indices.verify(i => i.create(TypeMoq.It.isValue( { index: indexConfig.name } )), 
            TypeMoq.Times.once())
            
        indices.verify(i => i.putMapping(TypeMoq.It.isValue( { index: indexConfig.name, type: indexConfig.type, body: indexConfig.mappings[0] } )), 
            TypeMoq.Times.once())
    })

    it( 'deleteIndex', async () => {

        await esIndexer.deleteIndex()

        indices.verify(i => i.delete(TypeMoq.It.isValue( { index: indexConfig.name } )), 
            TypeMoq.Times.once())
    })
})

describe('ElasticsearchDataIndexer index', () => {
    
    let dataProvider = TypeMoq.Mock.ofType<IDataProvider>()
    let dataStream = new ReplaySubject<string>()
    
    dataProvider.setup(d => d.get()).returns(() => dataStream)
    
    let indexConfig: IndexConfig = {
        name: 'sampleName',
        type: 'sampleType',
        mappings: [{}]
    }

    let es = TypeMoq.Mock.ofType<Client>()
    
    let esIndexer = new ElasticsearchDataIndexer(indexConfig, es.object, dataProvider.object)

    it( 'processes correct number of documents', async () => {
        
        // seed the observable with some documents
        let document = 'sample document'
        let documentsCount = 137
        for (let i = 0; i < documentsCount; i++) {
            dataStream.next(document)
        }

        // mark the observable as complete so the subscriber knows its finished
        dataStream.complete()

        let documentsIndexed = await esIndexer.index()

        assert.equal(documentsCount, documentsIndexed)
        es.verify(e => e.bulk(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce())
    })
})


