const oracledb = require('oracledb');
const dbconnect = require('./src/config/dbconnect.js');
const tratamentoDados = require('./src/utils/tratamentoDados.js');
// Ativar o modo Thick e apontar para o Oracle Instant Client
oracledb.initOracleClient({ libDir: 'C:\\Program Files\\Oracle\\instantclient_basic\\instantclient_23_7' });
const bpmClientes = require('./src/utils/bpmClientes.js');

async function conectarBancoOracle() {
    let connection;

    try {
        console.log("Tentando conectar ao Oracle...");
        connection = await oracledb.getConnection(dbconnect);

        console.log("Conectado ao Oracle!");
        console.log("***Versão do servidor: " + connection.oracleServerVersionString + "***");

        let ids_vendedores = await BuscarVendedores(connection);
        let clientesPorVendedor = await BuscarClientePorIDdeVendedor(connection, ids_vendedores);
        let dadosTratados = {};


        //console.log(clientesPorVendedor.rows);

        //Tratar os dados para padrão tabelas BPM
        clientesPorVendedor.rows.forEach(cliente => {
            if (cliente.SERIALIZED_DATA) {
                try {
                    let clienteDados = JSON.parse(cliente.SERIALIZED_DATA); // Converte JSON corretamente
                    dadosTratados = tratamentoDados.TratarDados(clienteDados, dadosTratados, cliente.STATUS);
                    //console.log("Dados tratados após processamento:", JSON.stringify(dadosTratados, null, 2));
                } catch (error) {
                    console.error("Erro ao converter JSON:", error);
                }
            } else {
                console.error("Erro: SERIALIZED_DATA está undefined para o cliente", cliente.DOCUMENTNR);
            }
        });
        console.log(dadosTratados);
        //Iterar enquanto for vazio
        if (dadosTratados && Object.keys(dadosTratados).length > 0) {

            //Para cada cliente
            Object.entries(dadosTratados).forEach(([DOCUMENTNR, cliente]) => {

                try {
                    // Obtém o status atual do cliente
                    let clienteStatus = cliente.STATUS;
                    console.log("STATUS DO CLIENTE: "  + cliente.STATUS);
                    // Cria ou atualiza o cliente
                    let bpmCliente =  bpmClientes.updateOrCreateClient(cliente, "E");

                } catch (error) {
                    //console.log(error);
                }

            });
        } else {
            console.log("O objeto payload está vazio!");
        }

    } catch (error) {
        console.error("Erro ao conectar:", error);
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log("Conexao encerrada com sucesso");
            } catch (ErroEncerramento) {
                console.log("Erro ao encerrar conexao: ", ErroEncerramento);
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

            console.log("\n**IDs dos Vendedores Ativos:**");
            //console.table(ids_vendedores);

            return ids_vendedores;
        } else {
            console.log("Nenhum vendedor ativo encontrado!");
            return [];
        }
    } catch (error) {
        console.error("Erro ao buscar vendedores ativos no sellers:", error);
        return [];
    }
}

async function BuscarClientePorIDdeVendedor(connection, ids_vendedores) {
    try {

        if (ids_vendedores.length === 0) {
            console.log("Nenhum ID de vendedor fornecido.");
            return [];
        }

        // Criar um número de bind variables igual ao número de IDs no vetor
        let binds = ids_vendedores.map((_, i) => `:id${i}`).join(", ");

        let sql = `
        SELECT 
            c.SERIALIZED_DATA, 
            G.SEQPESSOA, 
            c.DOCUMENTNR, 
            cs.STATUS
        FROM HUB.CUSTOMERS c
        JOIN HUB.CUSTOMER_SELLERS cs 
            ON cs.DOCUMENTNR = c.DOCUMENTNR
        LEFT JOIN HUB.BPM_CLIENTES BC 
            ON BC.NROCGCCPF || LPAD(BC.DIGCGCCPF, 2, '0') = LTRIM(C.DOCUMENTNR, '0')
        LEFT JOIN CONSINCO.GE_PESSOA G 
            ON G.NROCGCCPF || LPAD(G.DIGCGCCPF, 2, '0') = LTRIM(C.DOCUMENTNR, '0')
        LEFT JOIN CONSINCO.MRL_CLIENTE MC 
            ON MC.SEQPESSOA = G.SEQPESSOA
        WHERE cs.SELLER_ID IN (${binds}) 
          AND cs.STATUS IN ('PEN')
          AND G.SEQPESSOA IS NULL
          AND TRUNC(c.CREATED_AT) >= SYSDATE - 560
          AND BC.NROCGCCPF IS NULL
    `;

        // Criar um objeto de binds dinâmico
        let bindParams = {};
        ids_vendedores.forEach((id, i) => {
            bindParams[`id${i}`] = id;
        });

        let resultado = await connection.execute(sql, bindParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });


        if (resultado.rows.length > 0) {
            console.log("\n**Clientes encontrados:**");
            console.table(resultado.rows);



            // **Converter os CLOBs para strings**
            for (let row of resultado.rows) {
                if (row.SERIALIZED_DATA && row.SERIALIZED_DATA.getData) {
                    row.SERIALIZED_DATA = await row.SERIALIZED_DATA.getData();
                }
            }

            console.log("\n**Clientes encontrados (conversão do CLOB) :**");
            //console.log(resultado.rows);
        } else {
            console.log("Nenhum cliente encontrado!");
        }

        return resultado;
    } catch (error) {
        console.error("Erro ao buscar clientes com base no ID do vendedor", error);
        return [];
    }
}