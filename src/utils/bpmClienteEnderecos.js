const oracledb = require("oracledb");
const dbconnect = require('../config/dbconnect.js') // Arquivo de conexão com Oracle

class bpmClienteEnderecos {
    static async bpmClienteEnderecos(parametroEndereco, address) {

        let connection;

        try {
            connection = await oracledb.getConnection(dbconnect);

            // Verifica se o endereço já existe para o cliente com base em cliente_id e cep
            const queryVerifica = `
                SELECT id FROM hub.bpm_cliente_enderecos
                WHERE cliente_id = :cliente_id AND cep = :cep
            `;
            const verificaResultado = await connection.execute(queryVerifica, {
                cliente_id: parametroEndereco.cliente_id,
                cep: parametroEndereco.cep
            });

            // Combina os dados de parametroEndereco e address
            const dadosCombinados = {
                cliente_id: parametroEndereco.cliente_id,
                cep: parametroEndereco.cep,
                tipoend: parametroEndereco.tipoend,
                cidade: formatarNomeCidade(address.cidade),
                uf: address.uf.toUpperCase(),
                pais: address.pais || 'BR', // Valor padrão
                bairro: address.bairro,
                logradouro: address.logradouro,
                nrologradouro: address.nrologradouro,
                cmpltlogradouro: address.cmpltlogradouro || null
            };

            if (verificaResultado.rows.length > 0) {
                // Se o endereço já existe, atualiza os dados
                const updateQuery = `
                    UPDATE hub.bpm_cliente_enderecos
                    SET cidade = :cidade, uf = :uf, pais = :pais, bairro = :bairro,
                        logradouro = :logradouro, nrologradouro = :nrologradouro, 
                        cmpltlogradouro = :cmpltlogradouro, tipoend = :tipoend, 
                        dtaatualizacao = SYSDATE
                    WHERE cliente_id = :cliente_id AND cep = :cep
                `;
                await connection.execute(updateQuery, dadosCombinados, { autoCommit: true });
                console.log(`Endereço atualizado com sucesso para o cliente ${parametroEndereco.cliente_id}`);
            } else {
                // Se o endereço não existe, insere um novo registro
                const insertQuery = `
                    INSERT INTO hub.bpm_cliente_enderecos (cliente_id, cidade, uf, pais, bairro, logradouro, 
                                                            nrologradouro, cmpltlogradouro, cep, tipoend, dtainclusao)
                    VALUES (:cliente_id, :cidade, :uf, :pais, :bairro, :logradouro, 
                            :nrologradouro, :cmpltlogradouro, :cep, :tipoend, SYSDATE)
                `;
                await connection.execute(insertQuery, dadosCombinados, { autoCommit: true });
                console.log(`Novo endereço associado ao cliente ${parametroEndereco.cliente_id}`);
            }


        } catch (error) {
            console.error("Erro ao atualizar ou inserir endereço do cliente:", error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }

    }

}
module.exports = bpmClienteEnderecos;


function formatarNomeCidade(cidade) {
    if (!cidade) return null;

    // Array de cidades com variações (última posição é a padronizada)
    let cidadesVariacoes = [
        ["ABRE CAMPO", "ABRE-CAMPO", "ABRECAMPO"],
        ["APICUM ACU", "APICUM-ACU", "APICUMACU"],
        ["ARCO IRIS", "ARCO-IRIS", "ARCOIRIS"],
        ["CEARA MIRIM", "CEARA-MIRIM", "CEARAMIRIM"],
        ["EMBU GUACU", "EMBU-GUACU", "EMBU GUACU", "EMBUGUACU"],
        ["ESTRELA D OESTE", "ESTRELA D'OESTE", "ESTRELA DOESTE"],
        ["GOVERNADOR DIX SEPT ROSADO", "GOVERNADOR DIX-SEPT ROSADO", "GOVERNADOR DIXSEPT ROSADO"],
        ["GUAJARA MIRIM", "GUAJARA-MIRIM", "GUAJARAMIRIM"],
        ["GUARANI D OESTE", "GUARANI D'OESTE", "GUARNI DOESTE"],
        ["GUARDA MOR", "GUARDA-MOR", "GUARDAMOR"],
        ["IGARAPE ACU", "IGARAPE-ACU", "IGARAPEACU"],
        ["IGARAPE MIRIM", "IGARAPE-MIRIM", "IGARAPEMIRIM"],
        ["ITAPECURU MIRIM", "ITAPECURU-MIRIM", "ITAPECURUMIRIM"],
        ["JI PARANA", "JI-PARANA", "JIPARANA"],
        ["NAO ME TOQUE", "NAO-ME-TOQUE", "NAOMETOQUE"],
        ["OLHOS D AGUA", "OLHOS-D'AGUA", "OLHOS D'AGUA", "OLHOSDAGUA"],
        ["PARIQUERA ACU", "PARIQUERA-ACU", "PARIQUERAACU"],
        ["PASSA E FICA", "PASSA-E-FICA", "PASSAEFICA"],
        ["PASSA QUATRO", "PASSA-QUATRO", "PASSAQUATRO"],
        ["PASSA SETE", "PASSA-SETE", "PASSASETE"],
        ["PASSA VINTE", "PASSA-VINTE", "PASSAVINTE"],
        ["PALMEIRA D OESTE", "PALMEIRA D'OESTE", "PALMEIRA DOESTE"],
        ["PAU D ARCO", "PAU-D'ARCO", "PAU D'ARCO", "PAU DARCO"],
        ["PAU D ARCO DO PIAUI", "PAU-D'ARCO DO PIAUI", "PAU D'ARCO DO PIAUI", "PAU DARCO DO PIAUI"],
        ["PEIXE BOI", "PEIXE-BOI", "PEIXEBOI"],
        ["PINDARE MIRIM", "PINDARE-MIRIM", "PINDAREMIRIM"],
        ["SANTA BARBARA D OESTE", "SANTA BARBARA D'OESTE", "SANTA BARBARA DOESTE"],
        ["SAO JOAO DEL REI", "SAO JOAO DEL-REI", "SAO JOAO DEL REI"],
        ["SAO JOAO DO PAU D ALHO", "SAO JOAO DO PAU-D'ALHO", "SAO JOAO DO PAU D'ALHO", "SAO JOAO DO PAU DALHO"],
        ["SAO MIGUEL DO PASSA QUATRO", "SAO MIGUEL DO PASSA-QUATRO", "SAO MIGUEL DO PASSA QUATRO"],
        ["SAPUCAI MIRIM", "SAPUCAI-MIRIM", "SAPUCAI MIRIM"],
        ["SEM PEIXE", "SEM-PEIXE", "SEM PEIXE"],
        ["TOME ACU", "TOME-ACU", "TOME ACU"],
        ["VARRE SAI", "VARRE-SAI", "VARRE SAI"],
        ["VENHA VER", "VENHA-VER", "VENHA VER"],
        ["XANGRI LA", "XANGRI-LA", "XANGRI LA"],
        ["XIQUE XIQUE", "XIQUE-XIQUE", "XIQUE XIQUE"]
    ];

    // Formata a cidade para maiúsculas e remove acentos
    cidade = cidade
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .toUpperCase();

    console.log("Cidade após normalização inicial: " + cidade);

    // Verifica se a cidade está nas variações
    for (let i = 0; i < cidadesVariacoes.length; i++) {
        if (cidadesVariacoes[i].includes(cidade.trim())) {
            console.log("Cidade encontrada na lista de variações: " + cidadesVariacoes[i][cidadesVariacoes[i].length - 1]);
            return cidadesVariacoes[i][cidadesVariacoes[i].length - 1]; // Retorna a versão padronizada (última posição)
        }
    }

    // Se não estiver na lista, retorna a cidade formatada
    return cidade;
}
