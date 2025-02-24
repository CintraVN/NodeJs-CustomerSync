const oracledb = require("oracledb");
const dbconnect = require('../config/dbconnect.js') // Arquivo de conexão com Oracle
const logger = require('../../src/utils/logger');
class bpmClienteTelefones {
    static async bpmClienteTelefones(parametroTelefone, phone) {
        
        let connection;

        try {
            connection = await oracledb.getConnection(dbconnect);

            // Verifica se o telefone já existe para o cliente
            const queryVerifica = `
                SELECT id FROM hub.bpm_cliente_telefones
                WHERE cliente_id = :cliente_id AND fonenro = :fonenro
            `;

            const verificaResultado = await connection.execute(queryVerifica, {
                cliente_id: parametroTelefone.cliente_id,
                fonenro: parametroTelefone.fonenro
            });

            if (verificaResultado.rows.length > 0) {
                // Atualiza o telefone existente
                const updateQuery = `
                    UPDATE hub.bpm_cliente_telefones
                    SET foneddd = :foneddd, fonecmpl = :fonecmpl, dtaatualizacao = SYSDATE
                    WHERE cliente_id = :cliente_id AND fonenro = :fonenro
                `;

                await connection.execute(updateQuery, {
                    ...parametroTelefone,
                    foneddd: phone.foneddd || null,
                    fonecmpl: phone.fonecmpl || null
                }, { autoCommit: true });

                //console.log(`Telefone atualizado para o cliente ${parametroTelefone.cliente_id}`);
                logger.debug(`Telefone atualizado para o cliente ${parametroTelefone.cliente_id}`);
            } else {
                // Insere um novo telefone
                const insertQuery = `
                    INSERT INTO hub.bpm_cliente_telefones (cliente_id, foneddd, fonecmpl, fonenro, dtainclusao)
                    VALUES (:cliente_id, :foneddd, :fonecmpl, :fonenro, SYSDATE)
                `;

                await connection.execute(insertQuery, {
                    ...parametroTelefone,
                    foneddd: phone.foneddd || null,
                    fonecmpl: phone.fonecmpl || null
                }, { autoCommit: true });

                //console.log(`Novo telefone associado ao cliente ${parametroTelefone.cliente_id}`);
                logger.debug(`Novo telefone associado ao cliente ${parametroTelefone.cliente_id}`);
            }


        } catch (error) {
            //console.error("Erro ao gravar/atualizar telefone:", error);
            logger.error(`Erro ao gravar/atualizar telefone cliente ID: ${parametroTelefone.cliente_id}`, error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
                logger.info("Conexão encerrada com sucesso após manipular BPM_CLIENTE_TELEFONES para o cliente : "+parametroTelefone.cliente_id);
            }
        }

    }

}
module.exports = bpmClienteTelefones;