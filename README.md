O **Cript-Chat** é uma aplicação de mensagens em tempo real focada em privacidade.  O objetivo deste projeto foi implementar um canal de comunicação onde nem mesmo o servidor tem acesso ao conteúdo das mensagens.

## Funcionalidades
- **Mensageria Instantânea:** Comunicação fluida via WebSockets.
- **Interface Limpa:** Foco na experiência do usuário e na velocidade.
- **Criptografia:** Criptografia E2EE, os próprios clients gerenciam o envio do nome e mensagens de desconexão. Foi utilizado o padrão `AES-GCM` com uma chave de `256 bits`.
- **Zero informação ao servidor**: O servidor funciona apenas como um mensageiro, mas não tem informações diretas ao conteúdo das mensagens.

## Tecnologias Utilizadas
- **Node.js**
- **HTML**
- **CSS**
- **JavaScript**

## API's utilizadas
- **WS (backend)**
- **WebSocket**
- **Crypto**
- **Notification**
