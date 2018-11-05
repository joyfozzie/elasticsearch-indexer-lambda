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
const TypeMoq = require("typemoq");
let assert = require('assert');
const es_data_indexer_1 = require("../src/es-data-indexer");
describe('ElasticsearchDataIndexer lifecycle methods', () => {
    let indexConfig = {
        name: 'sampleName',
        type: 'sampleType',
        mappings: [{}]
    };
    let indices = TypeMoq.Mock.ofType();
    let es = TypeMoq.Mock.ofType();
    es.setup(e => e.indices).returns(() => indices.object);
    let dataProvider = TypeMoq.Mock.ofType();
    let esIndexer = new es_data_indexer_1.ElasticsearchDataIndexer(indexConfig, es.object, dataProvider.object);
    it('createIndex', () => __awaiter(this, void 0, void 0, function* () {
        yield esIndexer.createIndex();
        indices.verify(i => i.create(TypeMoq.It.isValue({ index: indexConfig.name })), TypeMoq.Times.once());
        indices.verify(i => i.putMapping(TypeMoq.It.isValue({ index: indexConfig.name, type: indexConfig.type, body: indexConfig.mappings[0] })), TypeMoq.Times.once());
    }));
    it('deleteIndex', () => __awaiter(this, void 0, void 0, function* () {
        yield esIndexer.deleteIndex();
        indices.verify(i => i.delete(TypeMoq.It.isValue({ index: indexConfig.name })), TypeMoq.Times.once());
    }));
});
describe('ElasticsearchDataIndexer index', () => {
    let dataProvider = TypeMoq.Mock.ofType();
    let dataStream = new rxjs_1.ReplaySubject();
    dataProvider.setup(d => d.get()).returns(() => dataStream);
    let indexConfig = {
        name: 'sampleName',
        type: 'sampleType',
        mappings: [{}]
    };
    let es = TypeMoq.Mock.ofType();
    let esIndexer = new es_data_indexer_1.ElasticsearchDataIndexer(indexConfig, es.object, dataProvider.object);
    it('processes correct number of documents', () => __awaiter(this, void 0, void 0, function* () {
        // seed the observable with some documents
        let document = 'sample document';
        let documentsCount = 137;
        for (let i = 0; i < documentsCount; i++) {
            dataStream.next(document);
        }
        // mark the observable as complete so the subscriber knows its finished
        dataStream.complete();
        let documentsIndexed = yield esIndexer.index();
        assert.equal(documentsCount, documentsIndexed);
        es.verify(e => e.bulk(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
    }));
});
//# sourceMappingURL=es-data-indexer-tests.js.map