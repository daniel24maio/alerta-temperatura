# Firmware ESP32 em JavaScript (Runtime Espruino / Node.js-style)

Este diretório contém a implementação do firmware do ESP32 escrita inteiramente em **JavaScript** para execução no runtime **Espruino**.

---

## Como Gravar o Runtime Espruino no ESP32

1. **Instalar a ferramenta esptool**:
   ```bash
   pip install esptool
   ```
2. **Baixar o firmware binário do Espruino para ESP32**:
   - Baixe a versão recente de `esp32-xxxx.bin` em [espruino.com/binaries](https://www.espruino.com/binaries/).
3. **Gravar a imagem binária via USB**:
   ```bash
   esptool.py --port /dev/ttyUSB0 erase_flash
   esptool.py --port /dev/ttyUSB0 --chip esp32 write_flash -z 0x1000 esp32-xxxx.bin
   ```
4. **Enviar o arquivo `main.js`**:
   - Utilize a extensão **Espruino Web IDE** (no Chrome) ou o utilitário de linha de comando `espruino-cli`:
   ```bash
   npm install -g espruino
   espruino -p /dev/ttyUSB0 -b 115200 main.js
   ```
