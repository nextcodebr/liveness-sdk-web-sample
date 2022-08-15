# NXCD - LIVENESS WEB

Detecção e padronização de fotos da face

### Requerimentos:

- Baixar os arquivos de faceapi e modelos da pasta [/libs](https://github.com/nextcodebr/liveness-sdk-web-sample/blob/master/libs)


### Ambientes:
- **Desenvolvimento**: `HTTP` só é possível rodar a aplicação em `localhost`. Exemplo: `http://localhost:5500`
- **Produção**: obrigatório ser `HTTPS` devido às restrições dos navegadores

### Procedimentos de utilização:
Exemplo de utilização em [sample.html](https://github.com/nextcodebr/liveness-sdk-web-sample/blob/master/sample.html)
1. Referenciar a bibioteca liveness-web na página

`<script src="https://cdn.jsdelivr.net/gh/nextcodebr/liveness-sdk-web-sample/dist/liveness.js"></script>`

2. Apontar a pasta que os modelos e o faceapi foram salvos em `configuration.faceapiPath`
3. Com a sua apikey, obter o JWT para repassar para o Liveness
4. Configurar a Liveness com o token recebido `configuration.token`
5. Definir qual elemento da DOM terá a câmera injetada pela biblioteca 
6. Fazer demais configurações:

`const configuration = {

          width: 720, // largura de exibição da câmera
          isDebug: false,
          token: jwt,
          faceapiPath: "/libs", // caminho para a faceapi e modelos baixados
          livenessUrlBase: "https://api-homolog.nxcd.app", // endpoint da api liveness
          livenessConfirmEndpoint: "", // opcional - default: /liveness
          isShowPreview: true, // exibir um preview da foto que será enviada
          errorCallback: error, // metodo de callback em caso de erro
          successCallback: success, // metodo de callback em caso de sucesso,
          brightnessControl: 108, // padrão 108 - controla a tolerancia do brilho para submeter a selfie (quanto menor o valor, maior a tolerancia e possibilidade de isAlive=false)
          luminanceControl: 23, // padrão 23 - controla a tolerancia da luminância para submeter a selfie (quanto menor o valor, maior a tolerancia e possibilidade de isAlive=false)
          ellipseStrokeStyle: "#D02780", // padrão '#D02780' - cor da elipse que encaixa o rosto - pode ser o nome da cor ou hexadecimal
          activatedEllipseStrokeStyle: "#46E3C3", // padrão '#46E3C3' - cor da elipse ao detectar o rosto - pode ser o nome da cor ou hexadecimal
          boxMessageBackgroundColor: "#D02780", // padrão '#D02780' - cor de fundo da caixa de mensagem - pode ser o nome da cor ou hexadecimal
          boxMessageTextColor: "#f3f3f5", // padrão '#f3f3f5' - cor a fonte da caixa de mensagem - pode ser o nome da cor ou hexadecimal
          configEyesBoxHeight: 100, // padrão 100 - setar a altura da caixa dos olhos em pixels (soma ou subtrai da altura padrão)
        };`
`window.liveness.stop(); parar o uso da camera`
`window.liveness.setMinBrightness(x) para setar o brilho mínimo de tolerancia (quanto menor, mais chances de isAlive=false)`
`window.liveness.setMinLuminance(x) para setar a luminância mínima de tolerancia (quanto menor, mais chances de isAlive=false)`
`window.liveness.setEyesBoxHeight(200); para setar a altura da caixa dos olhos em pixels (soma ou subtrai da altura padrão)`

Após a configuração, instanciar o Liveness:

`const videoWrapper = document.getElementById("video-wrapper");`

`const liveness = new Liveness(videoWrapper, config);`

Iniciar:

`liveness.start();`
