import { IsString, IsDefined } from 'class-validator';

class GetParamsDto {
    @IsString()
    @IsDefined()
    public projectName!: string;

    @IsString()
    @IsDefined()
    public modelName!: string;
}

export default GetParamsDto;