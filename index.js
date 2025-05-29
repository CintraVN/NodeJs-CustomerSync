const oracledb = require('oracledb');
const dbconnect = require('./src/config/dbconnect.js');
const tratamentoDados = require('./src/utils/tratamentoDados.js');
// Ativar o modo Thick e apontar para o Oracle Instant Client
oracledb.initOracleClient({ libDir: 'C:\\Program Files\\Oracle\\instantclient_basic\\instantclient_23_7' });
// Força o modo Thick
//oracledb.initOracleClient({ libDir: '/opt/oracle/instantclient_19_18' });
const bpmClientes = require('./src/utils/bpmClientes.js');
const bpmClienteOrigens = require('./src/utils/bpmClienteOrigens.js');
const bpmClienteEnderecos = require('./src/utils/bpmClienteEnderecos.js');
const bpmClienteTelefones = require('./src/utils/bpmClienteTelefones.js');
const bpmClienteRca = require('./src/utils/bpmClienteRca.js');
const logger = require('./src/utils/logger.js');
require('dotenv').config();
const dateRange = process.env.SQL_DATE_RANGE || 15; //definir dias da pesquisa.
const nrorepresentante1 = process.env.NROREPRESENTANTE1; 
const nrorepresentante2 = process.env.NROREPRESENTANTE2;

async function conectarBancoOracle() {
    let connection;

    try {
        //console.log("Tentando conectar ao Oracle...");
        //logger.info("Tentando conectar ao Oracle...");
        connection = await oracledb.getConnection(dbconnect);

        //console.log("Conectado ao Oracle!");
        //logger.info("Conectado ao Oracle!");
        //console.log("***Versão do servidor: " + connection.oracleServerVersionString + "***");
        //logger.info("***Versão do servidor: " + connection.oracleServerVersionString + "***");

        let ids_vendedores = await BuscarVendedores(connection);
        let clientesPorVendedor = await BuscarClientePorIDdeVendedor(connection, ids_vendedores);
        let dadosTratados = {};
        //let clienteStatus = null;
        //let origem_idVendedores = null;
        //let company_idVendedores = null;
        let parametroTelefone;


        //Tratar os dados para padrão tabelas BPM
        clientesPorVendedor.rows.forEach(cliente => {
            if (cliente.SERIALIZED_DATA) {
                try {
                    let clienteDados = JSON.parse(cliente.SERIALIZED_DATA); // Converte JSON corretamente
                    clienteDados.cliente_status = cliente.STATUS; //adicionado para teste
                    //clienteStatus = cliente.STATUS;
                    clienteDados.origem_id = cliente.ORIGEM_ID;//adicionado para teste
                    //origem_idVendedores = cliente.ORIGEM_ID;
                    //company_idVendedores = cliente.COMPANY_ID;
                    clienteDados.company_id = cliente.COMPANY_ID;//modificado dia 21/05/2025
                    //logger.debug(`🔍 valore dentro do FOR clienteDados.company_id: ${clienteDados.company_id}`);//teste
                    dadosTratados = tratamentoDados.TratarDados(clienteDados, dadosTratados, cliente.STATUS);
                } catch (error) {
                    logger.error("Erro ao converter JSON:", error);
                }
            } else {
                logger.error("Erro: SERIALIZED_DATA está undefined para o cliente", cliente.DOCUMENTNR);
            }
        });
        //Iterar enquanto for vazio
        if (dadosTratados && Object.keys(dadosTratados).length > 0) {

            //Para cada cliente
            Object.entries(dadosTratados).forEach(async ([DOCUMENTNR, cliente]) => {

                try {
                    // Cria ou atualiza o cliente
                    let bpmCliente = await bpmClientes.updateOrCreateClient(cliente, "E");


                    let parametroOrigens = {
                        'cliente_id': bpmCliente,
                        'origem_id': cliente.origem_id//origem_idVendedores trocado por cliente.origem_id
                    }

                    await bpmClienteOrigens.updateOrCreateBpmClienteOrigens(parametroOrigens, cliente.status);//clienteStatus trocado por cliente.status

                    // Associa enderecos
                    for (const [postalcd, address] of Object.entries(cliente.addressList)) {
                        let parametroEndereco = {
                            cliente_id: bpmCliente, // ID do cliente na BPM_CLIENTES
                            cep: postalcd, // Código postal do endereço
                            tipoend: '1' // Tipo de endereço (1 = Principal)
                        };

                        await bpmClienteEnderecos.bpmClienteEnderecos(parametroEndereco, address);
                    }

                    // Associa telefones
                    for (const [phonenr, phone] of Object.entries(cliente.phoneList)) {
                         parametroTelefone = {
                            cliente_id: bpmCliente, // ID do cliente na BPM_CLIENTES
                            foneddd: phone.foneddd || null, // Código DDD
                            fonecmpl: phone.fonecmpl || null, // Complemento do telefone
                            fonenro: phonenr // Número do telefone 
                        };

                        await bpmClienteTelefones.bpmClienteTelefones(parametroTelefone, phone);
                    }

                    // Busca o representante na tabela MAD_REPRESENTANTE
                    let companyIdTratado = cliente.company_id;//adicionado para teste
                    if (companyIdTratado === 804) companyIdTratado = 801;//adicionado para teste
                    //logger.debug(`🔍 Buscando representante para cliente ${DOCUMENTNR} com company_id: ${companyIdTratado}`);//teste
                  
                    let representante = await buscarRepresentante(connection, companyIdTratado);//company_idVendedores trocado para companyIdTratado
                    if (representante) {

                        // Chama a função para atualizar ou criar o RCA do cliente
                        await bpmClienteRca.bpmClienteRca(representante, cliente, parametroTelefone, bpmCliente);
                    
                    } else {
                        logger.debug("Nenhum representante encontrado para a company_id:", companyIdTratado);//company_idVendedores trocado para companyIdTratado
                    }

                } catch (error) {
                    logger.error('Erro ao na sincronia',error);
                }

            });
        } else {
            logger.warn("O objeto dadosTratados está vazio!");
        }

    } catch (error) {
        logger.error("Erro ao conectar:", error);
    } finally {
        if (connection) {
            try {
                await connection.close();
                //console.log("Conexao encerrada com sucesso");
                //logger.info("Conexao encerrada com sucesso");
            } catch (ErroEncerramento) {
                logger.error("Erro ao encerrar conexao: ", ErroEncerramento);
            }
        }
    }
}

conectarBancoOracle();




async function BuscarVendedores(connection) {
    try {
        let select = "select * from hub.sellers where status = 'A' and id not in (4,5)";
        let resultado_vendedores = await connection.execute(`${select}`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (resultado_vendedores.rows.length > 0) {

            let ids_vendedores = resultado_vendedores.rows.map(vendedor => vendedor.ID).sort((a, b) => a - b);

            return ids_vendedores;
        } else {
            logger.warn("Nenhum vendedor ativo encontrado!");
            return [];
        }
    } catch (error) {
        logger.error("Erro ao buscar vendedores ativos no sellers:", error);
        return [];
    }
}

async function BuscarClientePorIDdeVendedor(connection, ids_vendedores) {
    try {

        if (ids_vendedores.length === 0) {
            logger.debug("Nenhum ID de vendedor fornecido.");
            return [];
        }

        // Criar um número de bind variables igual ao número de IDs no vetor
        let binds = ids_vendedores.map((_, i) => `:id${i}`).join(", ");

        let sql = `
        SELECT 
            c.SERIALIZED_DATA, 
            G.SEQPESSOA, 
            c.DOCUMENTNR, 
            cs.STATUS,
            cs.SELLER_ID,
            s.ORIGEM_ID,
            s.COMPANY_ID
        FROM HUB.CUSTOMERS c
        JOIN HUB.CUSTOMER_SELLERS cs 
            ON cs.DOCUMENTNR = c.DOCUMENTNR
        JOIN HUB.SELLERS S
            ON s.ID = CS.SELLER_ID
        LEFT JOIN HUB.BPM_CLIENTES BC 
            ON BC.NROCGCCPF || LPAD(BC.DIGCGCCPF, 2, '0') = LTRIM(C.DOCUMENTNR, '0')
        LEFT JOIN CONSINCO.GE_PESSOA G 
            ON G.NROCGCCPF || LPAD(G.DIGCGCCPF, 2, '0') = LTRIM(C.DOCUMENTNR, '0')
        LEFT JOIN CONSINCO.MRL_CLIENTE MC 
            ON MC.SEQPESSOA = G.SEQPESSOA
        WHERE cs.SELLER_ID IN (${binds}) 
          AND cs.STATUS IN ('PEN')
          AND G.SEQPESSOA IS NULL
          AND TRUNC(c.CREATED_AT) >= SYSDATE - ${dateRange}
          AND BC.NROCGCCPF IS NULL
    `;
        // Criar um objeto de binds dinâmico
        let bindParams = {};
        ids_vendedores.forEach((id, i) => {
            bindParams[`id${i}`] = id;
        });

        let resultado = await connection.execute(sql, bindParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (resultado.rows.length > 0) {
            //logger.debug("**Clientes encontrados:**");

            // **Converter os CLOBs para strings**
            for (let row of resultado.rows) {
                if (row.SERIALIZED_DATA && row.SERIALIZED_DATA.getData) {
                    row.SERIALIZED_DATA = await row.SERIALIZED_DATA.getData();
                }
            }

        } else {
            logger.warn("Nenhum cliente encontrado!");
        }

        return resultado;
    } catch (error) {
        logger.error("Erro ao buscar clientes com base no ID do vendedor", error);
        return [];
    }
}

async function buscarRepresentante(connection, company_id) {

    try {
        connection = await oracledb.getConnection(dbconnect);

        const query = `
            SELECT nroempresa, nrorepresentante, nroequipe, apelido, nrosegmento
            FROM CONSINCO.MAD_REPRESENTANTE
            WHERE NROREPRESENTANTE BETWEEN ${nrorepresentante1} AND ${nrorepresentante2}
            AND (NROEMPRESA = :company_id OR (:company_id = 804 AND NROEMPRESA = 801))
        `;

        const result = await connection.execute(query, { company_id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        //logger.debug(`Resultado da consulta de representante (company_id ${company_id}):`, result.rows);
        return result.rows.length > 0 ? result.rows[0] : null;

    } catch (error) {
        logger.error("Erro ao buscar representante:", error);
        throw error;
    } finally {
        if (connection) {
            await connection.close();
            logger.info("Conexão encerrada com sucesso após buscar o representante.");
        }
    }
}