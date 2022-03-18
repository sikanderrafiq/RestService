import express = require("express");
import edge = require("edge-js");
import HttpException from "../../../exceptions/httpexception";
import ParamsDto from "../../common/params.dto";
import validateParamsMiddleware from "../../../middleware/paramsvalidator.middleware";
import UtilsService from '../../common/utils.service';
import PvtService from './pvt.service'
import MongoDBService from "../mongodb/mongodb.service";
import UpdateParamsDto from "../../common/updateparams.dto";
import ResponseError from "../../common/responseerror";
import { ParamsDeleteDto } from "../../common/deleteparams.dto";
import { ObjectID } from "mongodb";
import Routing from "../../../utils/routing";
import GetParamsDto from "../../common/getparams.dto";


// test url: http://localhost:20006/pvt
class PvtController {
    public path = '/pvt';
    public pathinsert = '/pvt/insert';
    public router = express.Router();
    private mongoDBService: MongoDBService = MongoDBService.getInstance();

    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.get(this.path,                              validateParamsMiddleware(GetParamsDto),    this.getPvtData);
        this.router.put(this.path,                              validateParamsMiddleware(UpdateParamsDto), this.updatePvtData);
        this.router.post(this.path,                             validateParamsMiddleware(ParamsDto),       this.createPvtData);
        this.router.delete(this.path,                           validateParamsMiddleware(ParamsDeleteDto), this.deletePvtData);
        this.router.post(this.pathinsert,                       validateParamsMiddleware(ParamsDto), this.insertPvtData);
        this.router.get(Routing.addToPath(this.path, `import`), validateParamsMiddleware(ParamsDto),       this.importPvtData);
        this.router.get(Routing.addToPath(this.path, `test`),   validateParamsMiddleware(GetParamsDto),    this.getTest);
    }

    /*
     * Get test API for unit testing
     */
    getTest = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        console.log('getTest: called');

        const query = request.query;
        let projectName: string = query['projectName'].toString();
        let modelName:   string = query['modelName'].toString();
        let methodName:  string = query['methodName'].toString();

        response.jsonp({​​​​​​​​code:200}​​​​​​​​);
    }

    /*
     * Get all PVT data from Mongodb and return to the client based on provided projectName and modelName
     */
    getPvtData = (request: express.Request, response: express.Response, next: express.NextFunction) => {
        console.log('getPvtData: called');

        const query = request.query;
        let projectName: string = query['projectName'].toString();
        let modelName:   string = query['modelName'].toString();
        let methodName:  string = query['methodName'].toString();

        //methodName = methodName.toUpperCase();
        this.mongoDBService.find(
            MongoDBService.collectionsNames.Pvt, 
            { projectName: projectName, modelName: modelName, methodName: methodName},
            {},
            this.findCallback(this, response, next));
    }

    /*
     * Parse PVT dat file and insert all its data into Mongodb, get all PVT data from Mongodb and return to the client 
     * based on provided projectName and modelName
     */
    importPvtData = (request: express.Request, response: express.Response, next: express.NextFunction) => {
        console.log('importPvtData: called');

        const query = request.query;
        let projectName: string = query['projectName'].toString();
        let modelName:   string = query['modelName'].toString();
        let methodName:  string = query['methodName'].toString();
        let datFilePath: string = query['datFilePath'].toString();

        let projectPath = UtilsService.getProjectPath(projectName);
        let modelPath = UtilsService.getModelPath(projectPath, modelName);
        datFilePath = UtilsService.getNormalizedPath(datFilePath);

        PvtService.importPvtData(
            modelPath, 
            datFilePath, 
            this.importPvtDataCallback(this, projectName, modelName, methodName, response, next)
        );
    }

    importPvtDataCallback(
        outerThis: any,
        projectName: string,
        modelName: string,
        methodName: string,
        response: express.Response, 
        next: express.NextFunction): {(error: any, result: any): void}  
    {
        return function(error: any, result: any)  {
            if (error) {
                console.log('importPvtData: Error in dll function calling: ', error.name, error.message);
                const error_message = {
                    error_name: error.name,
                    error_message: error.message
                };
                next(new HttpException(404, JSON.stringify(error_message)));
            } else {
                // data received from backend system
                const data = JSON.parse(result);
                let apiGroup = data["APIGROUP"];
                outerThis.insertJsonInDb(outerThis, projectName, modelName, methodName, apiGroup,response, next);
            }
        }
    }

    findCallback(
        outerThis: any,
        response: express.Response, 
        next: express.NextFunction): {(error: any, result: any): void} 
    {
        return function(error: any, result: any)  {
            if (error) {
                console.error('find: Error in loading data from mongodb: ', error.name, error.message);
                const error_message = { error_name: error.name, error_message: error.message };
                next(new HttpException(404, JSON.stringify(error_message)));
            } else {
                response.send({
                    code: 200,
                    data: result
                });
            }
        }
    }

    createPvtData = (request: express.Request, response: express.Response, next: express.NextFunction) => {
        console.log('createPvtData: called');

        const query = request.query;
        let projectName: string = query['projectName'].toString();
        let modelName:   string = query['modelName'].toString();
        let datFileName: string = query['datFilePath'].toString();
     
        let projectPath = UtilsService.getProjectPath(projectName);
        let modelPath   = UtilsService.getModelPath(projectPath, modelName);
        let datFilePath = UtilsService.getExportedDatPath(projectPath, datFileName);

        this.mongoDBService.find(
            MongoDBService.collectionsNames.Pvt, 
            { projectName: projectName, modelName: modelName},
            {},
            function(error: any, result: any) {
                let data = result;
                PvtService.removeExtraData(data);
                PvtService.createPvtData(
                    modelPath, 
                    datFilePath, 
                    data,
                    function(error: any, result: any) {
                        if (error) {
                            console.log('createPvtData: Error in loading dll: ', error.name, error.message);
                            const error_message = {
                                error_name: error.name,
                                error_message: error.message
                            };
                            next(new HttpException(400, JSON.stringify(error_message)));
                        } else {
                            console.log('createPvtData: result:  ', result);
                            response.send({ code: 200, result: result });
                        }
                    }
                );
            }
        );

    }

    updatePvtData = (request: express.Request, response: express.Response, next: express.NextFunction) => {
        console.log('updatePvtData: called');

        try {
            let data: any = request.body;
            const query = request.query;
            if (query) {
                let id: string = query['id'].toString();
                this.mongoDBService.update(MongoDBService.collectionsNames.Pvt, id, data, function (error: any, result: any) {
                    if (error) {
                        console.error('insertOne: Error in saving data in mongodb: ', error.name, error.message);
                        const error_message = { error_name: error.name, error_message: error.message };
                        next(new HttpException(404, JSON.stringify(error_message)));
                    } else {
                        response.send({
                            code: 200,
                            data: result
                        });
                    }
                });
            }
        }
        catch (exp) {
            console.error(exp);
            response.jsonp(new ResponseError);
        }
    }

    private deletePvtData(request: express.Request, response: express.Response, next: express.NextFunction): void {
        console.log('deletePvtData: called');

        try {
            const query = request.query;
            if (query) {
                let projectName: string = query['projectName'].toString();
                let modelName: string   = query['modelName'].toString();
                let ids: string         = query['ids'];

                // create db query and proceed with db search
                let dbQuery: any = { "$and": [] };
                
                if (ids !== undefined)
                    dbQuery["$and"].push({ "_id": { $in: ids.split(",").map((id: string) => new ObjectID(id) ) }});

                if (projectName !== undefined)
                    dbQuery["$and"].push({ "projectName": projectName });
                if (modelName !== undefined)
                    dbQuery["$and"].push({ "modelName": modelName });
                
                MongoDBService.getInstance().deleteMany(MongoDBService.collectionsNames.Pvt,
                    dbQuery, 
                    (error: Error | undefined, result: any) => {
                        if (error) {
                            const error_message = { error_name: error.name, error_message: error.message };
                            next(new HttpException(404, JSON.stringify(error_message)));
                        }
                        else if (result !== undefined) {
                            response.send({
                                code: 200,
                                data: result
                            });
                        }
                    }
                );
            }
        }
        catch (error) {
            console.error(error);
            const error_message = { error_name: (<Error>error).name, error_message: (<Error>error).message };
            next(new HttpException(404, JSON.stringify(error_message)));
        }
    }

    insertPvtData = (request: express.Request, response: express.Response, next: express.NextFunction) => {
        console.log('insertPvtData: called');

        try {
            let data: any = request.body;
            const query = request.query;
            if (query) {
                let projectName: string = query['projectName'].toString();
                let modelName: string   = query['modelName']?.toString();
                let methodName:  string = query['methodName']?.toString();
                this.insertJsonInDb(this, projectName, modelName, methodName, data, response, next);
            }
        }
        catch (exp) {
            console.error(exp);
            response.jsonp(new ResponseError);
        }
    }

    insertJsonInDb(
        outerThis: any,
        projectName: string,
        modelName: string,
        methodName: string,
        data: any[],
        response: express.Response,
        next: express.NextFunction)        
    {
        PvtService.processPvtData(data, projectName, modelName, methodName);
        //UtilsService.writeJson(data, "C:/demodata/api/fromVIP/falcon/apifluid.json");
        outerThis.mongoDBService.insertMany(MongoDBService.collectionsNames.Pvt, data, function(error: any, result: any) {
            if (error) {
                const error_message = { error_name: error.name, error_message: error.message };
                next(new HttpException(404, JSON.stringify(error_message)));
            } else {
                outerThis.mongoDBService.find(
                    MongoDBService.collectionsNames.Pvt, 
                    { projectName: projectName, modelName: modelName},
                    {},
                    outerThis.findCallback(outerThis, response, next));
            }
        });       
    }

}

export default PvtController;