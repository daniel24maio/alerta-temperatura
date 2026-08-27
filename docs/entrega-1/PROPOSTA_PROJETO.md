# Proposta do Projeto IoT - Entrega 1

**Título do Projeto**: Sistema de Alerta de Temperatura e Saúde Ambiental IoT  
**Domínio de Aplicação**: Monitoramento Ambiental, Saúde Ocupacional e Automação de Ambientes  

---

## 1. Identificação do Problema e Necessidade

Ambientes fechados de trabalho, estudo, laboratórios ou linhas de produção estão frequentemente sujeitos a variações ambientais que impactam diretamente a saúde, o conforto térmico e a capacidade cognitiva dos ocupantes:

1. **Temperaturas Elevadas (>30°C)**: Provocam estresse térmico, desidratação acelerada, fadiga e risco de insolação.
2. **Baixa Umidade Relativa do Ar (<40%)**: Causa ressecamento das vias aéreas, problemas respiratórios, irritação nos olhos e alergias.
3. **Associação de Alta Temp. e Baixa Umidade**: Condição crítica para a saúde humana, exigindo hidratação constante e redução de esforço físico.
4. **Ruído Sonoro Elevado (>75 dB)**: Gera perda de foco, irritabilidade, fadiga auditiva e dificulta a comunicação.

Em muitas organizações, essas variáveis não são monitoradas em tempo real ou dependem de verificações manuais esporádicas. **Existe a necessidade de uma solução IoT automatizada** capaz de realizar a leitura contínua dos fatores ambientais, exibir alertas imediatos no próprio local, transmitir telemetria para a nuvem/edge e permitir o controle automático e remoto de atuadores (como circuladores de ar, coolers, relés e alarmes sonoros/visuais).

---

## 2. Objetivos da Solução

### 2.1 Objetivo Geral
Desenvolver e implementar uma solução IoT integrada em formato de mono-repositório para monitoramento ambiental contínuo, geração de alertas visuais/sonoros e acionamento bidirecional de atuadores com confirmação de execução (ACK).

### 2.2 Objetivos Específicos
- Coletar dados de **Temperatura**, **Umidade** e **Nível de Som** através do nó sensor **ESP32**.
- Exibir as métricas e mensagens de alerta em um **Display TFT IPS Colorido ST7789 (2.25" SPI)** conectado ao ESP32.
- Transmitir a telemetria via **MQTT (QoS 1)** com payload JSON padronizado e tratamento de presença (**Last Will and Testament - LWT**).
- Validar as mensagens no **Gateway Node.js + TypeScript** usando schemas estritos com **Zod**.
- Persistir o estado atual, presença (`lastSeen`) e histórico temporal em banco chave-valor **Redis**.
- Disponibilizar um **Dashboard Web SPA em React 18 + TailwindCSS** para consulta em tempo real, visualização do display virtual e envio de comandos com resposta ACK.
- Containerizar toda a aplicação em **Docker Compose** com suporte para **Portainer Stack**.

---

## 3. Especificação dos Sensores e Atuadores

### 3.1 Sensores Envolvidos

| Sensor | Modelo / Componente | Interface / Pino no ESP32 | Grandeza Medida | Faixa de Operação / Limiar de Disparo |
| :--- | :--- | :---: | :--- | :--- |
| **Sensor de Temp. e Umidade** | **DHT22** (AM2302) | Digital (GPIO 15) | Temperatura (°C) e Umidade Relativa (%) | Temp: -40 a 80°C (Limiar: >30°C)<br>Umid: 0 a 100% (Limiar: <40%) |
| **Sensor de Ruído / Som** | **KY-038 / MAX4466** | Analógico ADC1 (GPIO 34) | Nível de Som Ambiente / Ruído (dB) | Entrada ADC de 0 a 4095 (Mapeado de 40 a 95 dB, Limiar: >75 dB) |

### 3.2 Atuadores Envolvidos

| Atuador | Modelo / Componente | Interface / Pino no ESP32 | Função no Sistema |
| :--- | :--- | :---: | :--- |
| **Display Local (Tela)** | **Display TFT IPS ST7789 (2.25" 76x284)** | Barramento Hardware SPI (8 Pinos: GPIO 18, 23, 4, 2, 5, 32) | Exibição gráfica contínua das métricas, status de conexão (Wi-Fi/MQTT) e faixa colorida de alerta. |
| **Atuador de Circulação / Potência**| **Módulo Relé Optoacoplado / Cooler** | Digital Output (GPIO 14) | Acionamento de ventilador/cooler para circulação de ar ou exaustão quando a temperatura excede 30°C. |
| **Atuador de Alerta Visual / Sonoro**| **LED Indicador / Buzzer** | Digital Output (GPIO 12) | Sinalização luminosa e sonora imediata em situações de alerta crítico ou ruído elevado. |

---

## 4. Matriz de Regras de Atuação e Saúde Ambiental

```text
+---------------------------------------------------------------------------------------------+
| REGRA 1: Alta Temperatura (>30°C)                                                           |
| Display LCD/TFT: "ALERTA: Temp >30C! Beba agua & ar em circulacao"                          |
| Atuador: Liga Cooler / Relé de Circulação (GPIO 14)                                         |
+---------------------------------------------------------------------------------------------+
| REGRA 2: Temperatura Amena (18-30°C) + Baixa Umidade (<40%)                                 |
| Display LCD/TFT: "ALERTA: Baixa umid! Hidrate-se / Evite ex. intenso"                       |
| Atuador: Sinalização sonora breve de atenção                                                |
+---------------------------------------------------------------------------------------------+
| REGRA 3: Alta Temp. (>30°C) + Baixa Umidade (<40%) [CRÍTICO!]                               |
| Display LCD/TFT: "CRITICO: Temp/Umid! Hidratar & ativ. baixa intens."                       |
| Atuador: Ativa LED de Alerta (GPIO 12) + Cooler de Circulação (GPIO 14)                     |
+---------------------------------------------------------------------------------------------+
| REGRA 4: Ruído Sonoro Elevado (>75 dB)                                                      |
| Display LCD/TFT: "ALERTA: Ruido alto! Favor manter silencio no local"                       |
| Atuador: Ativa LED de Alerta Visual (GPIO 12)                                               |
+---------------------------------------------------------------------------------------------+
```
