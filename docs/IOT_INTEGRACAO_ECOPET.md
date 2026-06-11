# Integração IoT ECOPET

Este documento descreve como conectar sensores e dispositivos reais à plataforma ECOPET.

## Arquitetura

```
Sensor / Dispositivo
       ↓
Gateway / API / MQTT
       ↓
Backend ECOPET  (POST /api/iot/readings)
       ↓
Banco de dados  (IotDevice, IotReading, IotAlert, IotDeviceLog)
       ↓
Dashboard web   (/iot, /agro/iot)
       ↓
Alertas + Automações + Robôs
```

## Entidades

| Modelo | Função |
|--------|--------|
| `IotDevice` | Dispositivo cadastrado (pet ou AgroPet) |
| `IotReading` | Leitura de telemetria |
| `IotAlert` | Alerta gerado por regra ou limiar |
| `IotDeviceLog` | Auditoria de eventos do dispositivo |
| `IotAutomation` | Regra gatilho → ação |
| `AgroUnit` | Unidade rural do parceiro |
| `AgroSensor` | Sensor vinculado à unidade AgroPet |
| `Pet` | Vínculo tutor → pet → dispositivo |

## API de ingestão

**Endpoint:** `POST /api/iot/readings`  
**Autenticação:** Bearer JWT (sensor gateway com credencial de parceiro/gestor)

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `deviceId` | string | sim | ID do dispositivo ECOPET |
| `userId` | string | não* | Dono (gestor pode informar) |
| `petId` | string | não | Pet vinculado |
| `agroUnitId` | string | não | Unidade AgroPet |
| `type` / `metricKey` | string | sim | Ex.: `temperature`, `soil_moisture` |
| `value` | number | sim | Valor medido |
| `unit` | string | não | Ex.: `°C`, `%` |
| `latitude` | number | não | GPS |
| `longitude` | number | não | GPS |
| `battery` | number | não | Nível bateria |
| `timestamp` | ISO8601 | não | Momento da leitura |
| `metadata` | object | não | Dados extras do fabricante |

\* Tutor/parceiro só pode enviar leituras dos próprios dispositivos.

### Exemplo

```bash
curl -X POST https://api.ecopet.com.br/api/iot/readings \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "clxxx",
    "metricKey": "temperature",
    "value": 38.2,
    "unit": "°C",
    "battery": 87,
    "latitude": -23.5505,
    "longitude": -46.6333
  }'
```

## Isolamento por usuário

- **Tutor:** vê apenas dispositivos dos próprios pets (`userId` / `pet.ownerId`).
- **Parceiro AgroPet:** vê dispositivos das próprias `AgroUnit`.
- **Gestor ECOPET:** acesso total para suporte e auditoria.
- Dispositivo sem dono válido **não** expõe dados a outros usuários.

## Modo demonstração

Sem hardware conectado:

1. Dashboard exibe banner **Modo demonstração**.
2. Botão **Simular leitura** gera telemetria via `POST /api/iot/devices/:id/simulate`.
3. Alertas e histórico funcionam normalmente para homologação.

## MQTT / Gateway (futuro)

Recomenda-se um gateway que:

1. Assine tópicos MQTT do fabricante (`device/{serial}/telemetry`).
2. Normalize payload para o schema ECOPET.
3. Autentique com token de serviço e chame `POST /api/iot/readings`.
4. Registre falhas em `IotDeviceLog`.

## Variáveis de ambiente

Não há chave IoT separada — use JWT de integração ou conta de parceiro com escopo limitado.

## Disclaimer obrigatório

> Os dados de IoT são indicadores preventivos e não substituem avaliação veterinária.

Exibido em `/iot` e documentação de produto.

## Testes de homologação

1. Login tutor → `/iot` → cadastrar dispositivo → simular leitura → ver alerta.
2. Login parceiro → `/agro/iot` → criar unidade → cadastrar sensor → simular clima/solo.
3. `POST /api/iot/readings` com deviceId de outro usuário → esperar **403**.
