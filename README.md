# NXCD - LIVENESS WEB

Detecção e padronização de fotos da face

### Requerimentos:

- Baixar os arquivos de faceapi e modelos da pasta [/libs](https://github.com/nextcodebr/liveness-sdk-web-sample/blob/master/libs)


### Ambientes:
- **Desenvolvimento**: **`HTTP`** só é possível rodar a aplicação em `localhost`. Exemplo: `http://localhost:5500`
- **Produção**: **`OBRIGATÓRIO`** ser `HTTPS` devido às restrições dos navegadores

### Procedimentos de utilização:
Exemplo de utilização em [sample.html](https://github.com/nextcodebr/liveness-sdk-web-sample/blob/master/sample.html)
1. Referenciar a bibioteca liveness-web na página

`<script src="https://cdn.jsdelivr.net/gh/nextcodebr/liveness-sdk-web-sample/dist/liveness.js"></script>`

2. Apontar a pasta que os modelos e o faceapi foram salvos em `configuration.faceapiPath`
3. Com a sua apikey, obter o JWT para repassar para o Liveness
4. Configurar a Liveness com o token recebido `configuration.token`
5. Definir qual elemento da DOM terá a câmera injetada pela biblioteca 
6. Fazer demais configurações:

```javascript
  const config = {
    isDebug: true // (opcional) - padrão false,
    token: jwt, // (obrigatório),
    faceapiPath: "/libs", // caminho para a faceapi e modelos baixados
    livenessUrlBase: "https://api-homolog.nxcd.app", // endpoint da api liveness - você pode setar a url base do seu backend
    livenessConfirmEndpoint: "", // opcional - padrão: /liveness - você pode setar o recurso do liveness em seu backend
    isShowPreview: true | false, // exibir um preview da foto que será enviada
    errorCallback: error, // metodo de callback em caso de erro na requisição
    successCallback: success, // metodo de callback em caso de sucesso (status: 200 com isAlive = true ou false)
    brightnessControl: 108, // somente desktop - padrão 108 - controla a tolerancia do brilho para submeter a selfie (quanto menor o valor, maior a tolerancia e possibilidade de isAlive=false)
    luminanceControl: 23, // somente desktop - padrão 23 - controla a tolerancia da luminância para submeter a selfie (quanto menor o valor, maior a tolerancia e possibilidade de isAlive=false)
    ellipseStrokeStyle: "#D02780", // padrão '#D02780' - cor da elipse que encaixa o rosto - pode ser o nome da cor ou hexadecimal
    activatedEllipseStrokeStyle: "#46E3C3", // padrão '#46E3C3' - cor da elipse ao detectar o rosto - pode ser o nome da cor ou hexadecimal
    boxMessageBackgroundColor: "#D02780", // padrão '#D02780' - cor de fundo da caixa de mensagem - pode ser o nome da cor ou hexadecimal
    boxMessageTextColor: "#f3f3f5", // padrão '#f3f3f5' - cor a fonte da caixa de mensagem - pode ser o nome da cor ou hexadecimal
    cameraPermissionErrorCallback: permissionErrorFunction // permite fazer a tratativa adequeada caso o usuário não tenha dado a permissão para usar a câmera
  };
```


Após a configuração, instanciar e injetar o Liveness:
```javascript
  const videoWrapper = document.getElementById("video-wrapper");
  const liveness = new Liveness(videoWrapper, config);
```

Iniciar o uso da câmera:

```javascript
  liveness.start();
```

Parar o uso da câmera:

```javascript
  liveness.stop();
```

# Release notes

### 6.8.7
1. Eventos javascript implementados `onpreviewopen`, `onpreviewclose`, `onuploadstart`, `onuploadend`

### 6.8.6
1. Adicionados hooks para serem executados em determinados momentos e que podem ser configurados na inicialização;
2. `onRequestUploadStart` quando inicia o upload da foto da face; `onRequestUploadEnd` quando o upload terminar;
`onRequestOpened` quando a conexão XMLHttpRequest for aberta; `onRequestLoading` quando estiver recebendo dados;
`onRequestUnsent` quando XMLHttpRequest foi criado mas ainda não enviado; `onRequestDone` executado quando a requisição
finalizar, independente do resultado.
3. `onRequestDone` é executado após o `successCallback`. Quando ele for setado, a lógica de restartar o SDK, por exemplo,
caso dê `isAlive=false` fica a cargo do metodo externo.

### 6.8.5
1. Melhoramentos nas validações de face;
2. Validações disponíveis `[background, faceLeft, faceRight, insideFrameBox, faceAbove, faceBelow, faceAway, faceCloser, faceNotBetweenEyesBox, notInsideEllipe]`
3. Ajustes canvas de debug;

### 6.8.4
1. Implementação de contagem regressiva de 3 segundos opcional antes de tirar a selfie + acessibilidade;
2. Ignora validações de posicionamento de faces, considerando somente estar encaixada no molde;

### 6.8.3
1. Interrupção de leitura de câmera enquanto faz upload da imagem;
2. Ajuste da frase de rosto centralizado na caixa de mensagens e também para leitores de tela;

### 6.8.2
1. Reconhecimento de mais poses: face abaixo da zona da foto, acima, à direita e à esquerda;
2. Refatoração e melhoramentos nos métodos de detecção;
3. Ajustes de acessibilidade.

### 6.8.1
1. Adicionadas novas dicas de ajustes (tips) quando `isAlive === false`, aconteça algum problema de token ou erro no servidor em `response.tips`;

### 6.8
1. Redefinição de mensagens na Caixa de Mensagens de aviso para o usuário;
2. Implementação e melhoria de acessibilidade (role=alert, aria-label, modal de carregamento acessível, alerta de foto tirada para leitores de tela e etc);

### 6.7
1. Possibilidade de escolher entre a câmera traseira e a frontal programaticamente, visando facilitar acessibilidade;
```javascript
liveness.setMobileFaceCam();
// ou
liveness.setMobileEnvironmentCam();
``` 

### 6.6
1. Possibilidade de configurar altura, largura e topo da elipse da máscara com as seguintes opções nas configurações iniciais, permitindo renderizar de maneiras diferentes em celular ou desktop:
```typescript
config.ellipseMaskWidth: number;
config.ellipseMaskHeight: number;
config.ellipseMaskTop: number;
config.ellipseMaskLeft: number;
``` 
* Exemplo de implementação em `sample.html`;

### 6.4
1. Possibilidade de aumentar em até 3 vezes o tamanho da foto que será enviada à API do Liveness com a seguinte opção na configuração inicial, melhorando a qualidade da foto para análise:
```typescript
config.scalingFactorForLiveness: number // (de 1 a 3)
``` 
* Exemplo de implementação em `sample.html`;

2. Ajuste automatico no aspect ratio da foto padrão para celulares;
3. Tratamento de exception quando feita requisição para a API;

### 6.3
1. Possibilidade de tratamento de erro de permissão de câmera com a função de callback com a seguinte opção na configuração inicial:
```typescript
config.cameraPermissionErrorCallback: function
``` 
* Exemplo de implementação em `sample.html`;

2. Implementação das dicas `response.tips` com o que pode ter acontecido de errado no retorno da requisição feita para a API e `isAlive=false`;

### 6.2
1. Possibilidade de configurar se o SDK deve detectar "Face Neutra" ou não na Caixa de Mensagens de aviso para o usuário, através da seguinte opção na configuração inicial: 
```typescript
config.shouldCheckNeutralFace: boolean
``` 
2. Ajustes de exibição em celulares fazendo com que o vídeo seja renderizado na largura total da tela para evitar distorções e `isAlive=false`;
3. Ajustes na estilização de popups para melhorar a UX;

### 6.1
1. Implementação do popup de "Face não encontrada" e prazo para checar se a face foi detectada ou não antes de exibí-lo ao usuário com as seguintes opções na configuração inicial:
```typescript
config.timeToDetectFace: number // milisegundos
config.showNotFoundModal: boolean // false
``` 

2. Possibilidade de configurar o tempo de atualização da captura de faces (loop onde o SDK fica checando se a face está posicionada corretamente)
```typescript
config.facetimeInterval: number // 150 milisegundos 
``` 

### 5.9
1. Possibilidade de selecionar se o envio para a API deve ser via `base64` ou `formData` (padrão base64) através do metodos
```javascript
liveness.setUseBase64()
// ou
liveness.setUseFormData()
``` 
2. Realiza a checagem ativa e exibe um popup de aviso caso o dispositivo fique offline no momento de tirar a selfie;
3. exibe o progresso do upload da foto para a API, fornecendo feedback para o usuário.