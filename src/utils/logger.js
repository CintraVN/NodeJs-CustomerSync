const { createLogger, format, transports } = require('winston');
require('dotenv').config();

// Formato personalizado para exibir logs no console
const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
);

const logger = createLogger({
    level: 'info', // Nível padrão de log
    format: logFormat,
    transports: [
        new transports.Console(), // Exibe no console
        new transports.File({ filename: 'logs/error.log', level: 'error' }), // Salva erros em arquivo
        new transports.File({ filename: 'logs/combined.log' }) // Salva todos os logs em arquivo
    ]
});
/*
// Desativar o log no console para producao
if (process.env.NODE_ENV === 'production') {
    logger.remove(new transports.Console());
}
*/
module.exports = logger;
