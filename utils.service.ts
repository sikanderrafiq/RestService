import { join, normalize } from 'path';
import Config from '../../config/config';

class UtilsService {
    getProjectPath(projectName: string): string {
        let projectPath: string = "";
        projectPath = join(Config.RootDataDir, projectName);
        projectPath = this.getNormalizedPath(projectPath);
        return projectPath;
    }

    getModelPath(projectPath: string, modelName: string): string {
        let modelPath: string = "";
        modelPath = join(projectPath, modelName + Config.ModelFileExtension);
        modelPath = this.getNormalizedPath(modelPath);
        return modelPath;
    }

    getExportedDatPath(projectPath: string, datFileName: string): string {
        let datFilePath: string = "";
        datFilePath = join(projectPath, "nexus_data/" + datFileName);
        datFilePath = this.getNormalizedPath(datFilePath);
        return datFilePath;
    }

    getNormalizedPath(filePath: string): string {
        if (filePath) {
            filePath = normalize(filePath);
            filePath = filePath.replace(/\\/g, '\/');
        }
        return filePath;
    }

    deepCopy(source: object) {
        return JSON.parse(JSON.stringify(source));
    }
}

export default new UtilsService();