const { createLogger, format, transports } = require('winston');
require('dotenv').config();

// Formato personalizado para exibir logs no console
const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
);

const logger = createLogger({
    level: 'debug', // Captura todos os níveis a partir de debug
    format: logFormat,
    transports: [
        new transports.Console({ level: 'debug' }), // Console captura todos os níveis
        new transports.File({ filename: 'logs/error.log', level: 'error' }), // Apenas erros
        new transports.File({ filename: 'logs/combined.log' }) // Captura todos os níveis sem restrição
    ]
});

// Desativar o log no console para produção
if (process.env.NODE_ENV === 'production') {
    logger.transports.forEach((t) => {
        if (t instanceof transports.Console) {
            logger.remove(t);
        }
    });
}

module.exports = logger;
