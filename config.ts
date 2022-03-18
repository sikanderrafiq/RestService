export default class Config
{
    // nexus projects root data dir
    static readonly RootDataDir: string = "D:\\demoData";
    
    // Nexus stuff path
    static readonly NexusNativeWrapperAssemblyFilePath: string = "./bin/NexusSDSWrapper.dll";
    static readonly NexusNativeWrapperTypeName: string = "NexusSDSWrapper.Startup";

    // file extensions
    static readonly ModelFileExtension: string = ".fcs";
    static readonly DatFileExtension: string = ".dat";
    static readonly JsonFileExtension: string = ".json";

    // file identifiers
    static readonly aquiferFileIdentifier: string = "_aquifer";
}