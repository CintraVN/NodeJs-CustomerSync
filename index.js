const oracledb = require('oracledb');
const dbconnect = require('./dbconnect');
// Ativar o modo Thick e apontar para o Oracle Instant Client
oracledb.initOracleClient({ libDir: 'C:\\Program Files\\Oracle\\instantclient_basic\\instantclient_23_7' });

async function conectarBancoOracle() {
    let connection;
    
    try {
        console.log("Tentando conectar ao Oracle...");
        connection = await oracledb.getConnection(dbconnect);

        console.log("Conectado ao Oracle!");
        console.log("***Versão do servidor:"+connection.oracleServerVersionString+"***");

        let select = "select * from hub.bpm_clientes where seqpessoa = 31279";
        let resultado = await connection.execute(`${select}`,[],{outFormat: oracledb.OUT_FORMAT_OBJECT});

        //console.log(resultado);
        //console.log(resultado.rows);

        if (resultado.rows && resultado.rows.length > 0) {
            console.log("\n**Dados Retornados:**\n");

            // Exibir apenas os valores (sem metadados)
            resultado.rows.forEach((row, index) => {
                console.log(`Registro ${index + 1}:`);
                console.table(row);
            });

        } else {
            console.log("Nenhum dado encontrado na consulta!");
        }
        

        
    } catch (error) {
        console.error("Erro ao conectar:", error);
    } finally{
        if (connection){
            try {
                await connection.close();
                console.log("Conexao encerrada com sucesso");
            } catch (ErroEncerramento) {
                console.log("Erro ao encerrar conexao: ",ErroEncerramento);
            }
        }
    }
}

conectarBancoOracle();
