# Guia de Implantação no Portainer (Portainer Stack)

Este guia ensina como implantar a infraestrutura completa do projeto em um servidor rodando o **Portainer** utilizando o recurso de **Stacks (Docker Compose)**.

---

## 1. Pré-requisitos
- Servidor Linux/macOS com Docker e Portainer instalados.
- Porta `1883` (MQTT), `9001` (WebSockets) e `3000` (Web Dashboard/API) liberadas no firewall do servidor.

---

## 2. Passo a Passo de Implantação

### Passo 1: Criar uma Nova Stack no Portainer
1. Acesse a interface web do seu Portainer (`http://ip-do-servidor:9000`).
2. Clique no seu ambiente (**Primary / Local**).
3. No menu lateral esquerdo, selecione **Stacks** e clique no botão **+ Add stack**.

### Passo 2: Configurar o Nome e o Conteúdo da Stack
1. **Name**: `alerta-temperatura-iot`
2. **Build method**: Selecione **Web editor** ou **Repository** (caso esteja usando Git público/privado).
3. **Web editor**: Cole o conteúdo integral do arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mosquitto:
    image: eclipse-mosquitto:2.0
    container_name: iot-mosquitto
    restart: always
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto/config/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
      - mosquitto-data:/mosquitto/data
      - mosquitto-logs:/mosquitto/log

  redis:
    image: redis:7-alpine
    container_name: iot-redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  gateway:
    build:
      context: ./gateway
      dockerfile: Dockerfile
    container_name: iot-gateway
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MQTT_BROKER_URL=mqtt://mosquitto:1883
      - REDIS_URL=redis://redis:6379
      - API_USER=${API_USER:-admin}
      - API_PASS=${API_PASS:-admin123}
    depends_on:
      - mosquitto
      - redis

volumes:
  mosquitto-data:
  mosquitto-logs:
  redis-data:
```

### Passo 3: Definir Variáveis de Ambiente
Na seção **Environment variables**, adicione:
- `API_USER` = `admin`
- `API_PASS` = `sua_senha_segura`

### Passo 4: Implantação
Role a página até o final e clique em **Deploy the stack**.

O Portainer fará o download das imagens do Mosquitto e do Redis, compilará o container do Gateway Node.js e iniciará os 3 serviços em uma rede isolada.

---

## 3. Verificação e Acesso
- **Dashboard Web**: `http://ip-do-servidor:3000`
- **Broker MQTT (ESP32)**: Apontar o ESP32 para `ip-do-servidor` na porta `1883`.
