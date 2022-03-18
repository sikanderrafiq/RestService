const envalid = require('envalid')
const { cleanEnv, str, host, port } = envalid

function validateEnv() {
    cleanEnv(process.env, {
        MONGO_DATABASE: str(),
        MONGO_HOST: host(),
        MONGO_PORT: port(),
    });
}

export default validateEnv;
  