# NXCD - LIVENESS WEB

Detecção e padronização de fotos da face

### Requerimentos:

- Baixar a biblioteca [Faceapi](https://justadudewhohacks.github.io/face-api.js/docs/index.html)
- Baixar os modelos [Modelos](https://justadudewhohacks.github.io/face-api.js/docs/index.html#models)


### Ambientes:
- **Desenvolvimento**: `HTTP` só é possível rodar a aplicação em `localhost`. Exemplo: `http://localhost:5500`
- **Produção**: obrigatório ser `HTTPS` devido às restrições dos navegadores

### Utilização:
Exemplo de utilização em [sample.html](https://github.com/nextcodebr/liveness-sdk-web-sample/blob/master/sample.html)
1. Referenciar a bibioteca liveness-web na página

`<script src="dist/liveness.js"></script>`

2. Com a apikey, obter o JWT para repassar para o Liveness
3. Definir qual elemento da DOM terá a câmera injetada pela biblioteca 
4. Configurar a Liveness com o token recebido
5. Fazer demais configurações:

`const config = {

          width: 720, // largura de exibição da câmera

          isDebug: false,

          token: jwt,

          faceapiModels: "/libs/faceapi/models", // caminho para os modelos da faceapi

          faceapiPath: "/libs/faceapi/face-api.min.js", // caminho para a faceapi

          livenessUrlBase: "https://api-homolog.nxcd.app", // endpoint da api liveness

          livenessConfirmEndpoint: "", // opcional - default: /liveness

          isShowPreview: true, // exibir um preview da foto que será enviada

          errorCallback: error, // metodo de callback em caso de erro

          successCallback: success, // metodo de callback em caso de sucesso

        };
`