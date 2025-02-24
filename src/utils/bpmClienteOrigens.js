const oracledb = require("oracledb");
const dbconnect = require('../config/dbconnect.js') // Arquivo de conexão com Oracle
const logger = require('../../src/utils/logger');
class bpmClienteOrigens {
    static async updateOrCreateBpmClienteOrigens(parametroOrigens, clienteStatus) {

        let connection;

        try {
            connection = await oracledb.getConnection(dbconnect);


            const queryVerifica = `
                SELECT id FROM hub.bpm_cliente_origens
                WHERE cliente_id = :cliente_id AND origem_id = :origem_id
            `;
            const verificaResultado = await connection.execute(queryVerifica, {
                cliente_id: parametroOrigens.cliente_id,
                origem_id: parametroOrigens.origem_id
            });

            if (verificaResultado.rows.length > 0) {
                // Se já existe, atualiza o status
                const updateQuery = `
                    UPDATE hub.bpm_cliente_origens
                    SET status = :status, dtaatualizacao = SYSDATE
                    WHERE cliente_id = :cliente_id AND origem_id = :origem_id
                `;
                await connection.execute(updateQuery, {
                    status: clienteStatus,
                    cliente_id: parametroOrigens.cliente_id,
                    origem_id: parametroOrigens.origem_id
                }, { autoCommit: true });

                //console.log(`Origem atualizada com sucesso para o cliente ${parametroOrigens.cliente_id} Origem: ${parametroOrigens.origem_id}`);
                logger.debug(`Origem atualizada com sucesso para o cliente ${parametroOrigens.cliente_id} Origem: ${parametroOrigens.origem_id}`);
            } else {
                // Se não existe, insere um novo registro
                const insertQuery = `
                    INSERT INTO hub.bpm_cliente_origens (cliente_id, origem_id, status, dtainclusao)
                    VALUES (:cliente_id, :origem_id, :status, SYSDATE)
                `;
                await connection.execute(insertQuery, {
                    cliente_id: parametroOrigens.cliente_id,
                    origem_id: parametroOrigens.origem_id,
                    status: clienteStatus
                }, { autoCommit: true });

                //console.log(`Nova origem associada ao cliente ${parametroOrigens.cliente_id} Origem: ${parametroOrigens.origem_id}`);
                logger.debug(`Nova origem associada ao cliente ${parametroOrigens.cliente_id} Origem: ${parametroOrigens.origem_id}`);
            }



        } catch (error) {
            //console.error("Erro ao manipular tabela HUB.BPM_CLIENTE_ORIGENS :", error);
            logger.error(`Erro ao manipular tabela HUB.BPM_CLIENTE_ORIGENS cliente ID: ${parametroOrigens.cliente_id}`, error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
                logger.info("Conexão encerrada com sucesso após manipular BPM_CLIENTE_ORIGENS para o cliente : "+parametroOrigens.cliente_id);
            }
        }

    }
}
module.exports = bpmClienteOrigens;