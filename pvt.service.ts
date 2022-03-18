import edge = require("edge-js");
import { accessSync } from 'fs';
import Config from '../../../config/config';
import UtilsService from '../../common/utils.service';

class PvtService {
    private apiGroupItemColumns: any[] = [];

    constructor() {
        this.init();
    }

    init() {
        this.apiGroupItemColumns = [
            { field: 'API' },
            { field: 'BlackOilData'},
            { field: 'APIGROUP'},
            { field: 'CompositionalData'},
            { field: 'FLUIDSYSTEM'},
            { field: 'DENSITYTYPE'},
            { field: 'projectName'},
            { field: 'modelName'},
            { field: 'methodName'}
        ];
    }

    findItem(item: any) {
        return item.field === this;
    }

    formatDataIfNeeded(data: any[]) {
        for (let i=0; i < data.length; i++) {
            const item = data[i];
            if (item["FLUIDSYSTEM"] === "COMPOSITIONAL"){
                item.CompositionalData =  UtilsService.deepCopy(item);
            }
            else {
                if (!item["APIGROUP"]) {
                    if (item.BlackOilData == undefined) {
                        item.BlackOilData = UtilsService.deepCopy(item);
                    }
                }
            }
        }
        this.removeExtraData(data);
    }

    removeExtraData(data: any[]) {
        for (let i=0; i < data.length; i++) {
            const item = data[i];
            for (var property in item) {
                let index = this.apiGroupItemColumns.findIndex(this.findItem, property);
                if (index == -1) {
                    delete item[property];
                }
            }
        }
    }

    public importPvtData(modelPath: string, datFilePath: string, callback: (error: Error, result: any) => void) {
        try {
            // validate paths
            try {
                accessSync(modelPath);
            }
            catch(e) { 
                modelPath = "";
            }
            accessSync(datFilePath);

            // define native function hook
            const nexusSDSWrapper = edge.func({
                assemblyFile: Config.NexusNativeWrapperAssemblyFilePath,
                typeName: Config.NexusNativeWrapperTypeName,
                methodName: 'LoadPvtData'
            });

            const payload = {
                'fcsFilePath': modelPath,
                'pvtDatFilePath': datFilePath
            }

            // call C# code
            nexusSDSWrapper(JSON.stringify(payload), callback);
        }
        catch (e) {
            console.error(e);
            callback(e, null);
        }
    }

    processPvtData(data: any[], projectName: string, modelName: string, methodName: string) {
        this.formatDataIfNeeded(data);
        for (let i=0; i < data.length; i++) {
            const item = data[i];
            let boData = item.BlackOilData;
            if (boData && boData.USGT && 
                boData.USGT.PivotColumn.length == 1 && 
                boData.USGT.PivotColumn[0] == 0 && 
                boData.USGT.AllUnSatTables.length == 1) 
            {
                boData.USGT = null;
            }
            item["projectName"] = projectName;
            item["modelName"]   = modelName;
            item["methodName"]  = methodName;
        }
    }

    public createPvtData(modelPath: string, datFilePath: string, data: any, callback: (error: Error, result: any) => void) {
        try {
            // validate paths
            try {
                accessSync(modelPath);
            }
            catch(e) { 
                modelPath = "";
            } 

            let nexusSDSWrapper = edge.func({
                assemblyFile: Config.NexusNativeWrapperAssemblyFilePath,
                typeName: Config.NexusNativeWrapperTypeName,
                methodName: 'CreatePvtDatFile'
            });

            const payload = {
                'fcsFilePath': modelPath,
                'jsonData': JSON.stringify(data),
                'pvtDatFilePath': datFilePath
            }

            // call C# code
            nexusSDSWrapper(JSON.stringify(payload), callback);
        }
        catch (e) {
            console.error(e);
            callback(e, null);
        }
    }
    
}

export default new PvtService();