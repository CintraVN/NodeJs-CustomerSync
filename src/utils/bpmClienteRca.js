const oracledb = require("oracledb");
const dbconnect = require('../config/dbconnect.js') // Arquivo de conexão com Oracle
const logger = require('../../src/utils/logger');

class bpmClienteRca {
    static async bpmClienteRca(representante, customer, paramsPhone, bpmCliente) {
        
        let connection;
        
        try {
            connection = await oracledb.getConnection(dbconnect);

            const queryVerifica = `
                SELECT cliente_id FROM hub.bpm_cliente_rca
                WHERE cliente_id = :cliente_id
            `;

            const verificaResultado = await connection.execute(queryVerifica, {
                cliente_id: bpmCliente
            });

            if (verificaResultado.rows.length > 0) {
                // Atualiza o RCA existente
                const updateQuery = `
                    UPDATE hub.bpm_cliente_rca
                    SET nrorepresentante = :nrorepresentante,
                        nroempresa = :nroempresa,
                        nroequipe = :nroequipe,
                        apelido = :apelido,
                        email = :email,
                        foneddd = :foneddd,
                        fonenro = :fonenro,
                        nrosegmento = :nrosegmento
                    WHERE cliente_id = :cliente_id
                `;

                await connection.execute(updateQuery, {
                    cliente_id: bpmCliente,
                    nrorepresentante: representante.nrorepresentante,
                    nroempresa: representante.nroempresa,
                    nroequipe: representante.nroequipe,
                    apelido: representante.apelido,
                    email: customer.email || null,
                    foneddd: customer.phoneList[paramsPhone.fonenro]?.foneddd || null,
                    fonenro: customer.phoneList[paramsPhone.fonenro]?.fonenro || null,
                    nrosegmento: representante.nrosegmento
                }, { autoCommit: true });

                //console.log(`RCA atualizado para o cliente ${bpmCliente}`);
                logger.debug(`RCA atualizado para o cliente ${bpmCliente}`);
            } else {
                // Insere um novo RCA
                const insertQuery = `
                    INSERT INTO hub.bpm_cliente_rca (
                        nrorepresentante, nroempresa, nroequipe, apelido, email, 
                        foneddd, fonenro, cliente_id, nrosegmento
                    ) VALUES (
                        :nrorepresentante, :nroempresa, :nroequipe, :apelido, :email, 
                        :foneddd, :fonenro, :cliente_id, :nrosegmento
                    )
                `;

                await connection.execute(insertQuery, {
                    cliente_id: bpmCliente,
                    nrorepresentante: representante.nrorepresentante,
                    nroempresa: representante.nroempresa,
                    nroequipe: representante.nroequipe,
                    apelido: representante.apelido,
                    email: customer.email || null,
                    foneddd: customer.phoneList[paramsPhone.fonenro]?.foneddd || null,
                    fonenro: customer.phoneList[paramsPhone.fonenro]?.fonenro || null,
                    nrosegmento: representante.nrosegmento
                }, { autoCommit: true });

                //console.log(`Novo RCA associado ao cliente ${bpmCliente}`);
                logger.debug(`Novo RCA associado ao cliente ${bpmCliente}`);
            }


        } catch (error) {
            //console.error("Erro ao criar/atualizar RCA:", error);
            logger.error(`Erro ao criar/atualizar RCA cliente ID: ${bpmCliente}`, error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
                logger.info("Conexão encerrada com sucesso após manipular BPM_CLIENTE_RCA para o cliente : "+bpmCliente);
            }
        }

    }

}
module.exports = bpmClienteRca;