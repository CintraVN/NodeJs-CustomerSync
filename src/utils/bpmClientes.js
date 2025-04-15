const oracledb = require("oracledb");
const dbconnect = require('../config/dbconnect.js') // Arquivo de conexão com Oracle
const logger = require('../../src/utils/logger');
class bpmClientes {
    static async updateOrCreateClient(cliente, origem = null) {
        let connection;
        try {
            connection = await oracledb.getConnection(dbconnect);

            //Verifica se o cliente já existe no banco
            const queryVerifica = `
                SELECT id FROM hub.bpm_clientes
                WHERE nrocgccpf = :nrocgccpf AND digcgccpf = :digcgccpf
            `;
            const verificaResultado = await connection.execute(
              queryVerifica, 
              {
                nrocgccpf: cliente.nrocgccpf,
                digcgccpf: cliente.digcgccpf
              },
              { 
                outFormat: oracledb.OUT_FORMAT_OBJECT 
              });
            //logger.debug(`Resultado da consulta de verificação: ${JSON.stringify(verificaResultado.rows[0], null, 2)}`);
            let bpmClienteId //= verificaResultado.rows[0].ID;

            if (verificaResultado.rows.length > 0) {
                // Cliente já existe -> Atualiza os dados
                bpmClienteId = verificaResultado.rows[0].ID; // ID do cliente encontrado
                logger.debug(`Cliente já existente - ID recuperado: ${bpmClienteId}`);

                const updateQuery = `
                    UPDATE hub.bpm_clientes
                    SET nomerazao = :nomerazao, fantasia = :fantasia, email = :email,
                        emailnfe = :emailnfe, fisicajuridica = :fisicajuridica, 
                        inscricaorg = :inscricaorg, representante = :representante, 
                        seqpessoa = :seqpessoa, observacao = :observacao, ramo_atividade = :ramo_atividade,
                        porte = :porte, status = :status, dtaatualizacao = SYSDATE
                    WHERE id = :id
                `;
                
                    const dadosCliente = {
                    nomerazao: cliente.nomerazao,
                    fantasia: cliente.fantasia,
                    email: cliente.email,
                    emailnfe: cliente.emailnfe,
                    fisicajuridica: cliente.fisicajuridica,
                    inscricaorg: cliente.inscricaorg,
                    representante: cliente.representante,
                    seqpessoa: cliente.seqpessoa || null,
                    observacao: cliente.observacao || null,
                    ramo_atividade: cliente.ramo_atividade || null,
                    porte: cliente.porte || null,
                    status: cliente.status,
                    id: bpmClienteId // no caso do UPDATE
                  };
                  
                await connection.execute(updateQuery, dadosCliente, { autoCommit: true });
                logger.debug(`Cliente atualizado com sucesso na BPM_CLIENTE com o ID:  ${bpmClienteId}`);
            } else {
                // Cliente não existe -> Insere um novo
                const insertQuery = `
                    INSERT INTO hub.bpm_clientes (nomerazao, fantasia, email, emailnfe, fisicajuridica, 
                                              nrocgccpf, digcgccpf, inscricaorg, representante, seqpessoa, 
                                              observacao, ramo_atividade, porte, status, dtainclusao)
                    VALUES (:nomerazao, :fantasia, :email, :emailnfe, :fisicajuridica, 
                            :nrocgccpf, :digcgccpf, :inscricaorg, :representante, :seqpessoa, 
                            :observacao, :ramo_atividade, :porte, :status, SYSDATE)
                    RETURNING id INTO :id
                `;

                const result = await connection.execute(insertQuery, {
                    nomerazao: cliente.nomerazao,
                    fantasia: cliente.fantasia,
                    email: cliente.email,
                    emailnfe: cliente.emailnfe,
                    fisicajuridica: cliente.fisicajuridica,
                    nrocgccpf: cliente.nrocgccpf,
                    digcgccpf: cliente.digcgccpf,
                    inscricaorg: cliente.inscricaorg,
                    representante: cliente.representante,
                    seqpessoa: cliente.seqpessoa,
                    observacao: cliente.observacao,
                    ramo_atividade: cliente.ramo_atividade,
                    porte: cliente.porte,
                    status: cliente.status,
                    id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER, maxSize: 10 }
                }, { autoCommit: true });
                

                bpmClienteId = result.outBinds.id[0]; // Pega o ID gerado
                logger.debug(`Cliente criado com sucesso na BPM_CLIENTE com o ID:  ${bpmClienteId}`);
            }

            // Se for cliente IFC precisa gravar a origem 'E'
            if (origem) {
                const updateOrigemQuery = `
                    UPDATE hub.bpm_clientes
                    SET origem = :origem
                    WHERE id = :id
                `;
                await connection.execute(updateOrigemQuery, { origem, id: bpmClienteId }, { autoCommit: true });
                logger.debug(`Origem atualizada com sucesso na BPM_CLIENTE_ORIGENS com o ID:  ${bpmClienteId}`);
            }

            
            return bpmClienteId;
        } catch (error) {
            logger.error(`Erro ao criar/atualizar cliente: ${cliente.nrocgccpf}${cliente.digcgccpf}`, error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
                logger.info("Conexão encerrada.");
            }
        }
    }
}

module.exports = bpmClientes;
