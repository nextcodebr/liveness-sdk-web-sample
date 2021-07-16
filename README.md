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

`<script src="https://cdn.jsdelivr.net/gh/nextcodebr/liveness-sdk-web-sample/dist/liveness.min.js"></script>`

2. Apontar a pasta que os modelos e o faceapi foram salvos em `configuration.faceapiPath`
3. Com a sua apikey, obter o JWT para repassar para o Liveness
4. Configurar a Liveness com o token recebido `configuration.token`
5. Definir qual elemento da DOM terá a câmera injetada pela biblioteca 
6. Fazer demais configurações:

>const configuration = {
          width: 720, // largura de exibição da câmera
          isDebug: false,
          token: jwt,
          faceapiPath: "/libs", // caminho para a faceapi e modelos baixados
          livenessUrlBase: "https://api-homolog.nxcd.app", // endpoint da api liveness
          livenessConfirmEndpoint: "", // opcional - default: /liveness
          isShowPreview: true, // exibir um preview da foto que será enviada
          errorCallback: error, // metodo de callback em caso de erro
          successCallback: success, // metodo de callback em caso de sucesso
        };

Após a configuração, instanciar o Liveness:

`const videoWrapper = document.getElementById("video-wrapper"); // obter elemento na tela onde o liveness será injetado`
`const liveness = new Liveness(videoWrapper, config); // instancia o liveness`

Iniciar:
`liveness.start();`