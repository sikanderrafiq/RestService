import { MongoClient, Collection, MongoError, DeleteWriteOpResultObject, Db, Cursor } from 'mongodb';
const ObjectID = require("bson-objectid");
import common from '../../../utils/common';
import utilsService from '../../common/utils.service';

export default class MongoDBService {

    /** @brief static ref for singleton use */
    private static instance: MongoDBService;

    /** @breif static method to use the singleton instance */
    public static getInstance() {
        if (!MongoDBService.instance) {
            MongoDBService.instance = new MongoDBService();
        }
        return MongoDBService.instance;
    }
    /** @brief holds name of all collection tables for easy reference */
    public static readonly collectionsNames = {

        WellSpecification: "WellSpecification",
        // well completion collection
        WellCompletion: "WellCompletion",
        //PVT collection
        Pvt: "Pvt",
        //PVT Water collection
        PvtWater: "PvtWater",
        // run control files data collection
        RunControlCollection: "ScheduleSetCollection",
    };
    private client: any = null;
    private _db: any = null;
    public mongo_db(): Db {
        return this._db;
    }
    
    public static readonly expressions = {
        $in: `$in`,     // =
        $nin: `$nin`,   // !=
        $gt: `$gt`,     // >
        $gte: `$gte`,   // >=
        $lt: `$lt`,     // <
        $lte: `$lte`,   // <=
    }

    constructor() {
        // set singleton ref
        MongoDBService.instance = this;

        console.log("MongoDBService::constructor called: ");
    }
    public async connectSync() {
        let uri: string = '';
        let mongoData = {
            "mongodb_dsif": {
                "user": "mongo-tiger3",
                "pass": "H0nh8NAFm6TcbFfZWtptP6nyxU6xyCj9ikcxy6xZfaTPPnspnjTl25dodsEp7Amk6PHBRsTov30x802fXX2Wzw==",
                "host": "mongodb-tiger4-oqhb0n.mongo.cosmos.azure.com",
                "port": "10255",
                "database": "nexus-db"
            },
            "mongodb_local": {
                "host": "localhost",
                "port": "27017",
                "database": "nexus-db"
            }
        };
        //let host = process.env.MSDP_SERVICE_MAP_mongodbservice_mongodb_host;
        let database_mongo = process.env.MSDP_SERVICE_MAP_mongodbservice_mongodb_database;
        let user = process.env.MSDP_SERVICE_MAP_mongodbservice_mongodb_user;
        let pass = process.env.MSDP_SERVICE_MAP_mongodbservice_mongodb_pass;
        try {
            if (this.client == null || this._db == null) {
                if (database_mongo && user && pass) {
                    uri = `mongodb://${mongoData.mongodb_dsif.user}:${mongoData.mongodb_dsif.pass}@${mongoData.mongodb_dsif.host}:${mongoData.mongodb_dsif.port}/${mongoData.mongodb_dsif.database}`;
                    // database_mongo = 'nexus-db';
                    // uri = `mongodb://${user}:${pass}@mongo.plat-system.svc.cluster.local:10255/${database_mongo}`;
                    this.client = await MongoClient.connect(uri, common.getConnOptions()
                        //{ useUnifiedTopology: true, sslValidate: false, tls: true, tlsAllowInvalidCertificates: true, poolSize: 10 }
                    );
                } else {
                    uri = `mongodb://${mongoData.mongodb_local.host}:${mongoData.mongodb_local.port}/${mongoData.mongodb_local.database}`;
                    // let { MONGO_DATABASE, MONGO_HOST, MONGO_PORT } = process.env;
                    // uri = `mongodb://${MONGO_HOST}:${MONGO_PORT}`;
                    // database_mongo = MONGO_DATABASE;                    
                    this.client = await MongoClient.connect(uri, { useUnifiedTopology: true, poolSize: 10 });
                }
                if (this.client instanceof MongoClient) {
                    this._db = this.client.db(mongoData.mongodb_dsif.database);
                    console.log(`mongo db connected ${uri}`);
                    return true;
                } else {
                    console.error(`mongo db connection error ${this.client}, uri=${uri}, db=${database_mongo}`);
                    return false;
                }
            } else {
                console.log(`client:${this.client}, db:${this._db}`);
            }
        } catch (err) {
            console.error(`mongo db connection catch error ${this.client}, uri=${uri}, db=${database_mongo},error: ${err}`)
            return false;
        }
    }

    private getUrl() {
        let uri: string = '';
        let mongoData = {
            "mongodb_dsif": {
                "user": "mongo-tiger3",
                "pass": "H0nh8NAFm6TcbFfZWtptP6nyxU6xyCj9ikcxy6xZfaTPPnspnjTl25dodsEp7Amk6PHBRsTov30x802fXX2Wzw==",
                "host": "mongo.plat-system.svc.cluster.local",
                "port": "10255",
                "database": "nexus-db"
            },
            "mongodb_local": {
                "host": "localhost",
                "port": "27017",
                "database": "nexus-db"
            }
        };
        let database_mongo = process.env.MSDP_SERVICE_MAP_mongodbservice_mongodb_database;
        let user = process.env.MSDP_SERVICE_MAP_mongodbservice_mongodb_user;
        let pass = process.env.MSDP_SERVICE_MAP_mongodbservice_mongodb_pass;
        if (database_mongo && user && pass) {
            uri = `mongodb://${mongoData.mongodb_dsif.user}:${mongoData.mongodb_dsif.pass}@${mongoData.mongodb_dsif.host}:${mongoData.mongodb_dsif.port}/${mongoData.mongodb_dsif.database}`;
            // database_mongo = 'nexus-db';
            // uri = `mongodb://${user}:${pass}@mongo.plat-system.svc.cluster.local:10255/${database_mongo}`;
            //this.client = await MongoClient.connect(uri, { useUnifiedTopology: true, sslValidate: false, tls: true, tlsAllowInvalidCertificates: true, poolSize: 10 });
        } else {
            uri = `mongodb://${mongoData.mongodb_local.host}:${mongoData.mongodb_local.port}/${mongoData.mongodb_local.database}`;
            // let { MONGO_DATABASE, MONGO_HOST, MONGO_PORT } = process.env;
            // uri = `mongodb://${MONGO_HOST}:${MONGO_PORT}`;
            // database_mongo = MONGO_DATABASE;                    
            //this.client = await MongoClient.connect(uri, { useUnifiedTopology: true, poolSize: 10 });
        }
        return uri;
    }
    /** 
     * @brief this method will try to auto connect to mongo db until a connection is established
     * @note if process env variables for mongo db are update programatically then this method should be called again else mongo connection will not update to the new uri
     */
    public async AutoConnect() {
        // get env params
        let { MONGO_DATABASE, MONGO_HOST, MONGO_PORT } = process.env;//, MONGO_USER, MONGO_PASSWORD
        let uri: string = common.isTiger() 
        ? `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}`
        : `mongodb://${MONGO_HOST}:${MONGO_PORT}`;
        console.log('mongo uri', uri)
        // define events
        let serverHeartbeatSucceeded: string = "serverHeartbeatSucceeded";
        let serverHeartbeatFailed: string = "serverHeartbeatFailed";
        let onServerHeartbeatSucceeded = () => {
            // update db reference
            if (!this._db) {
                this._db = this.client.db(MONGO_DATABASE);
                console.log("mongo db reconnected");
            }
        }
        let onServerHeartbeatFailed = () => {
            // clear db reference
            if (this._db) {
                this._db = null;
                console.log("mongo db disconnected");
            }
        }

        // clear previous _db and client references if they exists
        if (this._db)
            this._db = null;
        if (this.client) {
            this.client.removeListener(serverHeartbeatSucceeded, onServerHeartbeatSucceeded);
            this.client.removeListener(serverHeartbeatFailed, onServerHeartbeatFailed);
            this.client.close();
            this.client = null;
        }      

        MongoClient.connect(uri, common.getConnOptions(),
            (error: MongoError, result: MongoClient) => {
                if (error) {
                    this._db = null;
                    console.log(error);
                    this.AutoConnect();
                }
                else {
                    console.log(`mongo db connected ${uri}  ${MONGO_DATABASE}`);
                    // update references
                    this.client = result;
                    this._db = result.db(MONGO_DATABASE);
                    this.createAllCollections();
                    // subscribe to events
                    this.client.on(serverHeartbeatSucceeded, onServerHeartbeatSucceeded);
                    this.client.on(serverHeartbeatFailed, onServerHeartbeatFailed);
                }
            });
    }


    public connect(callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::connect called');
        try {
            const { MONGO_DATABASE, MONGO_HOST, MONGO_PORT } = process.env;
            //i.e. mongodb://localhost:27017/nexus-test
            MongoClient.connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`,
                { useUnifiedTopology: true, poolSize: 10 },
                this.connectCallback(this, callback)
            );
        }
        catch (e) {
            console.error(e);
        }
    }

    connectCallback(outerThis: any, callback: (error: Error, result: any) => void): { (err: any, client: any): void } {
        return function (err: any, client: any) {
            const { MONGO_DATABASE } = process.env;
            if (err) {
                console.log(`Error in connecting to mongodb: ${MONGO_DATABASE}, error=${err}`);
                callback(err, false);
            } else {
                console.log(`Connected to MongoDB database: ${MONGO_DATABASE}`);
                outerThis.client = client;
                outerThis.db = client.db(MONGO_DATABASE);
                callback(err, true);
            }
        }
    }

    public disconnect(callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::disconnect called');

        const err: any = null;
        try {
            this.client.close();
            this.client = null;
            this._db = null;
            callback(err, true);
        }
        catch (e) {
            console.error(e);
            callback(new Error("Exception occured in disconnect mongodb"), false);
        }
    }

    /*
     * @desc: insert array of items asynchrounously one by one by checking its existence. If item already exists, then don't add
     * otherwise add item
     */
    public async insertManyASync(colName: string, data: any[], callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::insertManyASync called');

        if (this._db == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }
        if (!Array.isArray(data) || (Array.isArray(data) && data.length < 1)) {
            callback(new Error("data type is not an array or length is 0"), false);
            return;
        }
        try {
            let errFlg: boolean = false;
            let col = this._db.collection(colName);
            for (var i = 0; i < data.length; i++) {
                let rowData = data[i];
                let ret = await col.findOneAndUpdate(
                    rowData,
                    { $set: rowData },
                    { upsert: true }
                );
                if (!ret.ok) {
                    callback(new Error("Error in findOneAndUpdate"), { result: false });
                    errFlg = true;
                    break;
                }
            }
            if (!errFlg) {
                const err: any = null;
                callback(err, { result: true });
            }
        } catch (e) {
            console.error(e);
            callback(<Error>e, null);
        }
    }

    /*
     * @desc: insert array of items one by one by checking its existence. If item already exists, then don't add
     * otherwise add item
     */
    public insertMany(colName: string, data: any[], callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::insertMany called');

        if (this.mongo_db() == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }
        if (!Array.isArray(data) || (Array.isArray(data) && data.length < 1)) {
            callback(new Error("data type is not an array or length is 0"), false);
            return;
        }
        try {
            this.findOneAndInsert(colName, data, 0, callback);
        } catch (e) {
            console.error(e);
            callback(<Error>e, null);
        }
    }

    private findOneAndInsert(
        colName: string,
        data: any,
        index: number,
        callback: (error: Error, result: any) => void) {
        this.findOneAndUpdate(
            colName,
            data[index],
            this.findOneAndInsertCallback(this, colName, data, ++index, callback)
        );
    }

    private findOneAndInsertCallback(
        outerThis: any,
        colName: string,
        data: any,
        index: number,
        callback: (error: Error, result: any) => void
    ): { (error: any, result: any): void } {
        return function (error: any, result: any) {
            if (error) {
                console.log('findAndInsertCallback: Error in saving data in mongodb: ', error.name, error.message);
                callback(error, false);
            } else {
                //iterate to next item and add in mongodb
                if (index < data.length) {
                    outerThis.findOneAndInsert(colName, data, index, callback);
                } else {
                    callback(error, true);
                }
            }
        }
    }

    public findOneAndUpdate(colName: string, data: any, callback: (error: Error, result: any) => void) {
        if (this.mongo_db() == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }

        try {
            //console.log("findOneAndUpdate#collectionName#data", `colName:${colName},data:${data}`)
            this.mongo_db().collection(colName).findOneAndUpdate(
                data,
                { $set: data },
                { upsert: true },
                function (err: Error, result: any) {
                    if (err) {
                        callback(err, false);
                    } else {
                        callback(err, result);
                    }
                }
            );
        }
        catch (e) {
            console.error(e);
            callback(<Error>e, null);
        }
    }

    public find(colName: string, query: object, sort: object, callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::find called');

        if (this.mongo_db() == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }

        try {
            let coll = this.mongo_db().collection(colName);
            if (Object.keys(sort).length > 0) {
                coll.createIndex(sort);
            }
            //i.e. sort = { well_name : 1}; //1 for ascending and -1 for descending order
            coll.find(query).sort(sort)
                .toArray(function (err: Error, result: any) {
                    if (err) {
                        callback(err, false);
                    } else {
                        callback(err, result);
                    }
                });
        }
        catch (e) {
            console.error(e);
            callback(<Error>e, null);
        }
    }

    public aggregate(colName: string, query: object, sort: object, paging: any, callback: (error: Error, result: any) => void, addFields: any = undefined, query2: any = undefined) {
        console.log('MongoDBService::aggregate called');

        if (this._db == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }
        try {
            // console.log("mongodb.service.aggregate#439#query", query);
            let aggregate: any[] = [
                { $match: query },
                //sort parameter example:
                //{age : -1} returns max age
                //{age : 1}  returns min age
                { $sort: sort },
                { $skip: paging.skip || 0 },
                { $limit: paging.limit || Number.MAX_SAFE_INTEGER }
            ];
            // add default fields values when fields are not present, make sure this is after $match stage
            if (addFields) {
                aggregate.splice(1, 0, { $addFields: addFields });
                if (query2) // add query2 in right order 
                    aggregate.splice(2, 0, { $match: query2 });
            }

            let outerThis = this;
            // console.log("mongodb.service.aggregate#450#params", aggregate);
            this._db.collection(colName).aggregate(aggregate, { allowDiskUse: true }).toArray(function (err: Error, result: any) {
                let asyncAction: any = new Promise(async (resolve: any, reject: any) => {
                    if (err) {
                        callback(err, false);
                    } else {
                        //The total record count get only on first page (i.e. skip == 0)
                        let totalitemscount = (paging.skip == 0) ? await outerThis._db.collection(colName).find(query).count(false) : -1;
                        let ret = {
                            paging: {
                                pageNumber: paging.limit > 0 ? (paging.skip / paging.limit) : 0,
                                pageSize: paging.limit || result.length,
                                pageItemsCount: result.length,
                                totalItemsCount: totalitemscount
                            },
                            data: result
                        }
                        callback(err, ret);
                    }
                });
                asyncAction;
            });
        }
        catch (e) {
            console.error("mongodb.service.aggregate#catch error", e);
            callback(<Error>e, null);
        }
    }

    public minOrMax(colName: string, query: object, sort: object, callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::minOrMax called');

        if (this._db == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }

        try {
            let aggregate: any[] = [
                { $match: query },
                //sort parameter example:
                //{age : -1} returns max age
                //{age : 1}  returns min age
                { $sort: sort },
                { $limit: 1 }
            ];
            //db.collection.aggregate([{$sort:{age:-1}}, {$limit:1}])
            this._db.collection(colName).aggregate(aggregate).toArray(function (err: Error, result: any) {
                if (err) {
                    callback(err, false);
                } else {
                    callback(err, result);
                }
            });
        }
        catch (e) {
            console.error(e);
            callback(<Error>e, null);
        }
    }

    public isExists(colName: string, query: object, sort: object, callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::isExists called');

        if (this._db == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }

        try {
            //i.e. sort = { well_name : 1}; //1 for ascending and -1 for descending order
            this._db.collection(colName).find(query).sort(sort).toArray(function (err: Error, result: any) {
                if (err) {
                    callback(err, false);
                } else {
                    let ret = (Array.isArray(result) && result.length > 0) ? true : false;
                    callback(err, ret);
                }
            });
        }
        catch (e) {
            console.error(e);
            callback(<Error>e, null);
        }
    }

    public insertOne(colName: string, data: any, callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::insertOne called');

        if (this.mongo_db() == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }

        try {
            this.mongo_db().collection(colName).insertOne(data, function (err: Error, result: any) {
                if (err) {
                    callback(err, false);
                }
                if (result.result.ok == 1) {
                    console.info('Inserted record count: ', result.insertedCount, ' Id: ', result.insertedId.toHexString());
                }
                callback(err, { insertedCount: result.insertedCount, id: result.insertedId.toHexString() });
            });
        }
        catch (e) {
            console.error(e);
            callback(<Error>e, null);
        }
    }

    public update(colName: string, id: string, data: any, callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::update called');

        if (this.mongo_db() == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }

        const filter = {
            _id: ObjectID(id)
        }

        try {
            this.mongo_db().collection(colName).updateOne(
                filter,
                { $set: data },
                { upsert: false },
                function (err: Error, result: any) {
                    if (err) {
                        callback(err, false);
                    } else {
                        callback(err, { modifiedCount: result.modifiedCount });
                    }
                }
            );
        }
        catch (e) {
            console.error(e);
            callback(<Error>e, null);
        }
    }

    public replace(colName: string, id: string, data: any, callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::update called');

        if (this._db == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }

        const filter = {
            _id: ObjectID(id)
        }

        try {
            this._db.collection(colName).replaceOne(
                filter,
                data,
                { upsert: false },
                function (err: Error, result: any) {
                    if (err) {
                        callback(err, false);
                    } else {
                        callback(err, { modifiedCount: result.modifiedCount });
                    }
                }
            );
        }
        catch (e) {
            console.error(e);
            callback(e, null);
        }
    }

    /** @brief create a new collection if it doesnt exist already, return TRUE is colelction exist or have been created successfully */
    public async createCollectionSync(collectionName: string): Promise<boolean> {
        return true;
    }

    public deleteOne(colName: string, id: string, callback: (error: Error, result: any) => void) {
        console.log('MongoDBService::delete called');

        if (this.mongo_db() == null) {
            callback(new Error("Connection to mongodb is not established"), false);
            return;
        }

        const filter = { _id: ObjectID(id) };

        try {
            this.mongo_db().collection(colName).deleteOne(
                filter,
                function (err: Error, result: any) {
                    if (err) {
                        callback(err, false);
                    } else {
                        callback(err, { result: result.result, deletedCount: result.deletedCount });
                    }
                }
            );
        }
        catch (e) {
            console.error(e);
            callback(<Error>e, null);
        }
    }

    public deleteMany(collectionName: string, filterQuery: any, callback: (error: Error | undefined, result: any) => void): void {
        try {
            if (this.mongo_db()) {
                let collection: Collection = this.mongo_db().collection(collectionName);
                if (collection) {
                    collection.deleteMany(filterQuery, (error: MongoError, deleteOp: DeleteWriteOpResultObject) => {
                        if (callback) {
                            if (error)
                                callback(new Error(error.message), undefined);

                            else {
                                let deletedDocs = 0;
                                if (deleteOp.deletedCount)
                                    deletedDocs = deleteOp.deletedCount;

                                callback(undefined, deletedDocs);
                            }
                        }
                    });
                    return;
                }
            }

            // when fails
            throw new Error("deleteMany DB error!");
        }
        catch (e) {
            console.error(e);
            callback(<Error>e, undefined);
        }
    }

    public async createIndexesOnCollection(collectionName: string): Promise<boolean> {

        if (collectionName && typeof (collectionName) === 'string' && collectionName.length > 0) {
            let collection: Collection = this.mongo_db().collection(collectionName);
            if (collection) {
                switch (collectionName) {

                    case MongoDBService.collectionsNames.WellCompletion:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ projectName: 1, modelName: 1, wellset_id: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case MongoDBService.collectionsNames.WellSpecification:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ projectName: 1, modelName: 1, wellset_id: 1, well_name : 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case MongoDBService.collectionsNames.WellControlsCollection:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ project_id: 1, model_id: 1, wellset_id: 1, date: 1, well: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case MongoDBService.collectionsNames.WellProductionDataCollection:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ project_id: 1, model_id: 1, wellset_id: 1, date: 1, well: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case MongoDBService.collectionsNames.WellSetCollection:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ project_id: 1, model_id: 1, orderIndex: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case MongoDBService.collectionsNames.ScheduleSetDataCollection:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ project_id: 1, model_id: 1, wellset_id: 1, Time: 1, date: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });

                        break;
                    case MongoDBService.collectionsNames.HydraulicCorrelationsCollection:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ date: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case MongoDBService.collectionsNames.GridOptionsCollection:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ date: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case "Modifier":
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ index: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case MongoDBService.collectionsNames.NodePipesCollection:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ date: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case MongoDBService.collectionsNames.OptionsDataCollection:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ date: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case MongoDBService.collectionsNames.ProfileTablesCollection:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ date: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    case MongoDBService.collectionsNames.ScheduleSetCollection:
                        collection.dropIndexes((error: any, result: any) => {
                            if (error)
                                console.log(error.message);
                            collection.createIndex({ orderIndex: 1 }, (error: any, result: any) => {
                                if (error)
                                    console.log(error.message);
                                else
                                    console.log(`mongo db created indexes on collection: ${collectionName}`);
                            });
                        });
                        break;
                    default:
                        break;
                }

                return true;
            }
        }

        return false;
    }

    public async createAllCollections(): Promise<boolean> {
        try {
            // first find the collection, if not then create it
            if (this.mongo_db()) { //[Asif Imam]
                let collectionsMongo: any[] = await this.mongo_db().listCollections().toArray();
                let collectionsNameMongo: any[] = collectionsMongo.map(collection => collection.name);
                const collectionNames: any[] = Object.values(MongoDBService.collectionsNames).filter((x, i, a) => a.indexOf(x) == i);
                for (let i = 0; i < collectionNames.length; i++) {

                    // create collection if missing
                    if (!collectionsNameMongo.includes(collectionNames[i]))
                        if (await this.mongo_db().createCollection(collectionNames[i])) { }
                        else { console.log(`failed to create mongo collection: ${collectionNames[i]}`); }

                    // create indexes 
                    this.createIndexesOnCollection(collectionNames[i]);
                }
                return true;
            }
            else {
                console.log(`failed to create all mongo collections!`);
            }
        }
        catch (e) {
            console.error(e);
            return false;
        }

        return false;
    }

}