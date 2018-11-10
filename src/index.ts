import { Config } from 'aws-sdk'
import { Client } from 'elasticsearch'

import { ElasticsearchDataIndexer } from './es-data-indexer'
import { IDataProvider } from './data-provider'
import { S3DataProvider } from './s3-data-provider'

const esEndpoint = process.env.ES_ENDPOINT
const esRegion = process.env.AWS_REGION

const indexConfig = {
    name: process.env.ES_INDEX_NAME,
    type: process.env.ES_INDEX_TYPE,

    mappings: [
        {
            properties: {
                customer_id: {
                    type: "integer"
                },
                warehouse_id: {
                    type: "integer"
                },
                first_name: {
                    type: "text"
                },
                last_name: {
                    type: "text"
                },
                customer_street_address: {
                    type: "text"
                },
                customer_city: {
                    type: "text"
                },
                customer_st: {
                    type: "text"
                },
                customer_zip_code: {
                    type: "text"
                },
                order_geo: {
                    properties: {
                        coordinates: {
                            type: "geo_point"
                        }
                    }
                },
                warehouse_geo: {
                    properties: {
                        coordinates: {
                            type: "geo_point"
                        }
                    }
                },
                warehouse_street_address: {
                    type: "text"
                },
                warehouse_city: {
                    type: "text"
                },
                warehouse_st: {
                    type: "text"
                },
                warehouse_zip: {
                    type: "text"
                },
                delivery_zone: {
                    type: "integer"
                },
                product_name: {
                    type: "text"
                },
                timediff: {
                    type: "double"
                },
                product_price: {
                    type: "text"
                },
                order_date_time: {
                    type: "date",
                    format: "yyyy-MM-dd HH:mm"
                },
                promised_delivery_date_time: {
                    type: "date",
                    format: "yyyy-MM-dd HH:mm"
                },
                actual_delivery_date_time: {
                    type: "date",
                    format: "yyyy-MM-dd HH:mm"
                },
                delivery_distance: {
                    type: "double"
                },
                delivery_distance_miles: {
                    type: "double"
                },
                delivery_status: {
                    type: "text"
                }
            }
        }
    ]
}

const esOptions = {
    hosts: [esEndpoint],
    connectionClass: require('http-aws-es'), 
    awsConfig: new Config({ region: esRegion }), 
    httpOptions: {} 
}

const s3Data = {
    region: process.env.AWS_REGION,
    bucket: process.env.S3_BUCKET,
    key: process.env.S3_KEY
}

const es = new Client(esOptions)

const dataProvider: IDataProvider = new S3DataProvider(s3Data.region, s3Data.bucket, s3Data.key)
const dataIndexer: ElasticsearchDataIndexer = new ElasticsearchDataIndexer(indexConfig, es, dataProvider) 

exports.handler = async (event, context) => {
    try {
        //await dataIndexer.deleteIndex()
        await dataIndexer.createIndex()
        await dataIndexer.index()
    } catch (error) {
        console.log(JSON.stringify(error))
    }
}



