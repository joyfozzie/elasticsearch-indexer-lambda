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
const operators_1 = require("rxjs/operators");
/**
 * Contains the elasticsearch life-cycle and indexing methods
 */
class ElasticsearchDataIndexer {
    constructor(indexConfig, es, dataProvider) {
        this.indexBufferSize = 50;
        this.es = es;
        this.indexConfig = indexConfig;
        this.dataProvider = dataProvider;
    }
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.createIndexWithName();
            console.log('created index with result: ' + result);
            yield this.createIndexMappings();
        });
    }
    createIndexWithName() {
        let indexOptions = { index: this.indexConfig.name };
        console.log('creating index with config: ' + JSON.stringify(indexOptions));
        return this.es.indices.create(indexOptions);
    }
    createIndexMappings() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let mapping of this.indexConfig.mappings) {
                yield this.es.indices.putMapping({
                    index: this.indexConfig.name,
                    type: this.indexConfig.type,
                    body: mapping
                });
                console.log('created index mapping: ' + mapping);
            }
        });
    }
    deleteIndex() {
        let indexOptions = { index: this.indexConfig.name };
        return this.es.indices.delete(indexOptions);
    }
    index() {
        return __awaiter(this, void 0, void 0, function* () {
            let preCount = 0;
            let postCount = 0;
            let observableFinished = false;
            let completion = null;
            let indexJob = new Promise((resolve, _) => {
                // Subscribe to the document stream from the data provider. Buffer items for efficient indexing in elasticsearch
                this.dataProvider.get().pipe(operators_1.bufferCount(this.indexBufferSize)).subscribe((documents) => __awaiter(this, void 0, void 0, function* () {
                    preCount += documents.length;
                    // For bulk inserts, es expects an action/document pair
                    let action = JSON.stringify({ index: { _index: this.indexConfig.name, _type: this.indexConfig.type } });
                    let bulkIndex = [];
                    for (let document of documents) {
                        bulkIndex.push(action);
                        bulkIndex.push(document);
                    }
                    try {
                        const response = yield this.es.bulk({ body: bulkIndex });
                        console.log(response);
                    }
                    catch (err) {
                        console.log(err);
                    }
                    postCount += documents.length;
                }), error => console.log(error), () => observableFinished = true);
                // I'm not a huge fan of this work-around. The problem is that the observable completes before the es.index async callbacks finish. 
                // This means that function exits with tasks still completing. This isn't a huge problem when the function is long-running. Since
                // this is going to be running in lambda, we don't want to leave trailing tasks around after execution, or we risk not indexing everything
                // we think we are.
                completion = rxjs_1.interval(10).subscribe(_ => {
                    if (observableFinished && preCount === postCount) {
                        resolve(postCount);
                    }
                });
            });
            // cleanup the completion observable and return the number of documents indexed.
            const result = yield indexJob;
            completion.unsubscribe();
            return result;
        });
    }
}
exports.ElasticsearchDataIndexer = ElasticsearchDataIndexer;
//# sourceMappingURL=es-data-indexer.js.map