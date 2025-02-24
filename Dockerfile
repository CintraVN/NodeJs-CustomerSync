# Usa a imagem base do Node.js
FROM node:14

# Evita interação manual e instala fuso horário automaticamente
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y tzdata libaio1 unzip && \
    ln -sf /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime && \
    echo "America/Sao_Paulo" > /etc/timezone

# Configura o fuso horário no ambiente
ENV TZ=America/Sao_Paulo

# Baixa e instala o Oracle Instant Client
RUN mkdir -p /opt/oracle && \
    cd /opt/oracle && \
    wget https://download.oracle.com/otn_software/linux/instantclient/1918000/instantclient-basic-linux.x64-19.18.0.0.0dbru.zip && \
    unzip instantclient-basic-linux.x64-19.18.0.0.0dbru.zip && \
    rm -f instantclient-basic-linux.x64-19.18.0.0.0dbru.zip && \
    cd instantclient_19_18 && \
    echo "/opt/oracle/instantclient_19_18" > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig

# Define as variáveis de ambiente para o Oracle
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_19_18:${LD_LIBRARY_PATH}
ENV ORACLE_HOME=/opt/oracle/instantclient_19_18
ENV PATH=$ORACLE_HOME:$PATH
ENV TNS_ADMIN=/opt/oracle/instantclient_19_18

# Cria o diretório da aplicação
WORKDIR /usr/src/app

# Copia os arquivos de configuração
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o código da aplicação
COPY . .

# Garante que o .env será carregado corretamente
RUN chmod 600 .env

# Expõe a porta 3000
EXPOSE 3000

# Mantém o contêiner rodando e executa o script a cada 5 minutos
CMD while true; do node index.js; sleep 300; done
