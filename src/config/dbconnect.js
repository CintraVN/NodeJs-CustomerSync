require('dotenv').config();

console.log("DB_CONNECTION_STRING:", process.env.DB_CONNECTION_STRING);
module.exports = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING
    //poolMin: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 1,
    //poolMax: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 5,
    //poolIncrement: process.env.DB_POOL_INCREMENT ? parseInt(process.env.DB_POOL_INCREMENT) : 1
};
