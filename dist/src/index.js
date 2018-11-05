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
const aws_sdk_1 = require("aws-sdk");
const elasticsearch_1 = require("elasticsearch");
const es_data_indexer_1 = require("./es-data-indexer");
const s3_data_provider_1 = require("./s3-data-provider");
const esEndpoint = process.env.ES_ENDPOINT;
const esRegion = process.env.AWS_REGION;
const indexConfig = {
    name: process.env.ES_INDEX_NAME,
    type: process.env.ES_INDEX_TYPE,
    mappings: [
        {
            properties: {
                geo: {
                    properties: {
                        coordinates: {
                            type: "geo_point"
                        }
                    }
                }
            }
        }
    ]
};
const esOptions = {
    hosts: [esEndpoint],
    connectionClass: require('http-aws-es'),
    awsConfig: new aws_sdk_1.Config({ region: esRegion }),
    httpOptions: {}
};
const s3Data = {
    region: process.env.AWS_REGION,
    bucket: process.env.S3_BUCKET,
    key: process.env.S3_KEY
};
const es = new elasticsearch_1.Client(esOptions);
const dataProvider = new s3_data_provider_1.S3DataProvider(s3Data.region, s3Data.bucket, s3Data.key);
const dataIndexer = new es_data_indexer_1.ElasticsearchDataIndexer(indexConfig, es, dataProvider);
exports.handler = (event, context) => __awaiter(this, void 0, void 0, function* () {
    try {
        //await dataIndexer.deleteIndex()
        yield dataIndexer.createIndex();
        yield dataIndexer.index();
    }
    catch (error) {
        console.log(JSON.stringify(error));
    }
});
//# sourceMappingURL=index.js.map