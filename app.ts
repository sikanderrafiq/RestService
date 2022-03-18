//SK: This import (i.e. dotenv/config) runs the config function for you and loads the .env file
import 'dotenv/config';
import validateEnv from './server/common/validateenv';
import Server from './server/server';
import PvtController from './server/components/pvt/pvt.controller';

validateEnv();

const server = new Server(
    [
        new PvtController(),
    ]
);

server.listen();

