const logger = require('../../src/utils/logger');
class tratamentoDados {
    static TratarDados(clienteDados, dadosTratados = {}, status) {
        try {
            if (!clienteDados.documentnr) {
                logger.warn("Nenhum valor encontrado retornando vazio");
                return dadosTratados;
            }

            // Formatar o número do documento para 14 dígitos com zeros à esquerda
            clienteDados.documentnr = clienteDados.documentnr.toString().padStart(14, "0");
            let nrocgccpf = clienteDados.documentnr.substring(0, 12);
            let digcgccpf = clienteDados.documentnr.substring(12, 14);

            // Se o cliente ainda não existir no dadosTratados, cria um novo objeto
            if (!dadosTratados[clienteDados.documentnr]) {
                dadosTratados[clienteDados.documentnr] = {
                    nomerazao: clienteDados.name,
                    fantasia: clienteDados.name,
                    email: clienteDados.email,
                    emailnfe: clienteDados.email,
                    fisicajuridica: 'J',
                    nrocgccpf: nrocgccpf,
                    digcgccpf: digcgccpf,
                    inscricaorg: clienteDados.statesubscription,
                    representante: clienteDados.representativenm,
                    seqpessoa: clienteDados.seqpessoa || null,
                    ramo_atividade: clienteDados.ramo_atividade || null,
                    status: status || null,

                    company_id: clienteDados.company_id || null,//adicionado 20/05/25
                    origem_id: clienteDados.origem_id || null//adicionado 22/05/25
                    //status: clienteDados.cliente_status || null//adicionado 22/05/25
                };
            }

            // Atualiza origem_id e company_id mesmo se já existirem
            dadosTratados[clienteDados.documentnr].origem_id = clienteDados.origem_id || null;
            dadosTratados[clienteDados.documentnr].company_id = clienteDados.company_id || null;
            
            // Acumula os endereços no dadosTratados
            if (clienteDados.addresses && clienteDados.addresses.length > 0) {
                let address = clienteDados.addresses[0];
                dadosTratados[clienteDados.documentnr]["addressList"] = dadosTratados[clienteDados.documentnr]["addressList"] || {};
                dadosTratados[clienteDados.documentnr]["addressList"][address.postalcd] = {
                    pais: 'BR',
                    logradouro: address.address,
                    nrologradouro: address.addressnr,
                    cmpltlogradouro: address.additionalinfo,
                    bairro: address.quarter,
                    cidade: address.city,
                    uf: address.state,
                    cep: address.postalcd.toString().padStart(8, "0")
                };
            }

            // Acumula os telefones no dadosTratados
            if (clienteDados.phones && clienteDados.phones.length > 0) {
                let phone = clienteDados.phones[0];
                dadosTratados[clienteDados.documentnr]["phoneList"] = dadosTratados[clienteDados.documentnr]["phoneList"] || {};
                dadosTratados[clienteDados.documentnr]["phoneList"][phone.phonenr] = {
                    fonecmpl: phone.phonetp,
                    foneddd: phone.areacd,
                    fonenro: phone.phonenr
                };
            }
            return dadosTratados;
        } catch (error) {
            logger.error(`Erro ao tratar dados do json cliente NR DOCUMENTO: ${clienteDados.documentnr}`, error);
            throw error;
        }
    }
}


module.exports = tratamentoDados;
