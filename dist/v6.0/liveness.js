var Liveness;(()=>{"use strict";var e={258:e=>{e.exports=class{constructor(e,t){this.uploadInProgress=0,this.requestType="b64";const i=window.innerWidth;this.config=t,t.width>=i&&(t.width=i),t.height=Math.floor(.7778*t.width),this.token=t.token,this.videoWrapper=e,this.faceapi=null,this.configFrameBox=t.frameBox;const n=document.createElement("style");n.innerText=this.cssOrientationLock(),document.head.appendChild(n),t.brightnessControl?this.brightnessControl=t.brightnessControl:this.brightnessControl=95,t.luminanceControl?this.luminanceControl=t.luminanceControl:this.luminanceControl=23,this.faceapiPath=t.faceapiPath,this.isShowPreview=t.isShowPreview,this.errorCallback=t.errorCallback,this.successCallback=t.successCallback,this.livenessUrlBase=t.livenessUrlBase,this.displaySize={width:t.width,height:t.height},this.livenessConfirmEndpoint=t.livenessConfirmEndpoint||"/liveness/v2",this.ellipseStrokeStyleDefault=t.ellipseStrokeStyle||"#D02780",this.activatedEllipseStrokeStyle=t.activatedEllipseStrokeStyle||"#46E3C3",this.boxMessageBackgroundColor=t.boxMessageBackgroundColor||"#D02780",this.boxMessageTextColor=t.boxMessageTextColor||"#f3f3f5",this.configEyesBoxHeight=t.configEyesBoxHeight||100,this.requestAnimationFrame=window.requestAnimationFrame,this.handleBeforeSubmitFunction=t.handleBeforeSubmitFunction}setUseBase64(){this.requestType="b64"}setUseFormData(){this.requestType="formData"}setMinBrightness(e){this.brightnessControl=e}setMinLuminance(e){this.luminanceControl=e}setFrameBoxesWidth(e,t,i){this.configFrameBox={eyesInner:e,eyesOutter:t,box:i}}setDimensionsRequestImage(e,t){this.config.dimensions={width:e,height:t}}toggleDebug(){this.config.isDebug=!this.config.isDebug,this.config.isDebug||this.canvas.getContext("2d").clearRect(0,0,this.canvas.width,this.canvas.height)}setEyesBoxHeight(e){this.configEyesBoxHeight=e}stop(){this.video.pause(),this.stream.getTracks().forEach((e=>e.stop())),clearInterval(this.timer),clearInterval(this.timerBackground)}async start(e){this.startCallbackFunction=e,window.faceapi?(this.faceapi=window.faceapi,this.setLiveness()):await this.loadFaceApi()}setLiveness(){this.setLoading(),this.createModalConfirmationWrapper().createModalConfirmation().createVideoElement().startVideo()}destroyLiveness(){this.stop(),this.removeCanvas(),this.resetVideoWrapper()}resetLiveness(){this.stop(),this.removeCanvas(),this.resetVideoWrapper(),this.closePreviewModal(),this.base64="",this.removeLoading(),this.setLiveness()}cssOrientationLock(){return"@media screen and (min-width: 320px) and (max-width: 767px) and (orientation: landscape) { html { transform: rotate(-90deg);transform-origin: left top;width: 100vh;overflow-x: hidden;position: absolute;top: 100%;left: 0;}}"}createCanvasBackground(){this.canvasBackground=document.createElement("canvas");const e=this.videoWrapper.clientWidth*this.getDevicePixelRatio(),t=this.videoWrapper.clientHeight*this.getDevicePixelRatio();window.innerWidth<720?(this.canvasBackground.width=2*e,this.canvasBackground.height=2*t):(this.canvasBackground.width=e,this.canvasBackground.height=t),this.config.dimensions&&(this.canvasBackground.width=this.config.dimensions.width,this.canvasBackground.height=this.config.dimensions.height),this.canvasBackground.style.display="none"}sweepVideo(e){this.luminanceAvg=0,this.brightnessSum=0,this.luminanceArray=[];for(let t=0;t<e.length;t+=4){const i=e[t],n=e[t+1],s=e[t+2];this.sweepBrightness(i,n,s),this.sweepLuminance(i,n,s)}this.checkBrightness()}isMobile(){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}checkBrightness(){this.brightness=Math.floor(this.brightnessSum/(this.canvasLuminance.width*this.canvasLuminance.height))}sweepBrightness(e,t,i){this.brightnessSum+=Math.floor((e+t+i)/3)}sweepLuminance(e,t,i){this.luminanceAvg+=this.calcLuminance(e,t,i),this.luminanceArray.push(this.calcLuminance(e,t,i)),this.luminance=this.luminanceAvg/this.luminanceArray?.length*100}calcLuminance(e,t,i){let n,s=[e,t,i];for(let e=0;e<s.length;e++)n=s[e]/255,n<=.03928?n/=12.92:n=Math.pow((n+.055)/1.055,2.4),s[e]=n;return.2126*s[0]+.7152*s[1]+.0722*s[2]+.05}getDevicePixelRatio(){let e;const t=navigator.userAgent.toLowerCase().indexOf("firefox")>-1;return void 0===window.devicePixelRatio||t?window.matchMedia?(e="(-webkit-min-device-pixel-ratio: 1.5),        (min--moz-device-pixel-ratio: 1.5),        (-o-min-device-pixel-ratio: 3/2),        (min-resolution: 1.5dppx)",window.matchMedia(e).matches?1.5:(e="(-webkit-min-device-pixel-ratio: 2),        (min--moz-device-pixel-ratio: 2),        (-o-min-device-pixel-ratio: 2/1),        (min-resolution: 2dppx)",window.matchMedia(e).matches?2:(e="(-webkit-min-device-pixel-ratio: 0.75),        (min--moz-device-pixel-ratio: 0.75),        (-o-min-device-pixel-ratio: 3/4),        (min-resolution: 0.75dppx)",window.matchMedia(e).matches?1.5:void 0))):1:window.devicePixelRatio}async loadFaceApi(){const e=document.createElement("script"),t=`${this.faceapiPath}/face-api.min.js`;return e.src=t,document.head.append(e),e.onload=async()=>{await this.loadFaceApiModels()},this}async loadFaceApiModels(){return setTimeout((async()=>{Promise.all([window.faceapi.nets.faceLandmark68Net.loadFromUri(this.faceapiPath),window.faceapi.nets.faceExpressionNet.loadFromUri(this.faceapiPath),window.faceapi.nets.faceRecognitionNet.loadFromUri(this.faceapiPath)]).then((async()=>{await window.faceapi.nets.tinyFaceDetector.loadFromUri(this.faceapiPath),console.log("Models were loaded"),this.faceapi=faceapi,this.setLiveness()})).catch((e=>console.error("error",e)))}),100),this}startVideo(){return void 0===navigator.mediaDevices&&(navigator.mediaDevices={}),void 0===navigator.mediaDevices.getUserMedia&&(navigator.mediaDevices.getUserMedia=function(e){const t=navigator.webkitGetUserMedia||navigator.mozGetUserMedia;return t?new Promise((function(i,n){t.call(navigator,e,i,n)})):Promise.reject(new Error("getUserMedia não implementado nesse browser"))}),navigator.mediaDevices.enumerateDevices().then((e=>{const t={video:{width:this.config.width,height:this.config.height,frameRate:24}};if(this.isMobile())t.video={facingMode:"user"};else{const i=e.filter((e=>"videoinput"===e.kind&&!e.label.includes("m-de:vice")))[0];i&&(t.video.deviceId=i.deviceId)}navigator.mediaDevices.getUserMedia(t).then((e=>{const t=document.querySelector("video");t&&(this.stream=e,navigator.streamLiveness=e,"srcObject"in t?t.srcObject=e:t.src=window.URL.createObjectURL(e),this.startCallbackFunction&&this.startCallbackFunction())})).catch((e=>console.error(e)))})),this}createVideoElement(){return this.video=document.createElement("video"),this.video.style.width="100%",this.video.style.height="100%",this.video.style.transform="scaleX(-1)",this.video.setAttribute("muted",!0),this.video.setAttribute("autoplay",!0),this.video.setAttribute("playsinline",""),this.videoWrapper.style.position="relative",this.videoWrapper.style.width=this.config.width,this.videoWrapper.style.height=this.config.height,this.videoWrapper.append(this.video),this.video.addEventListener("play",(()=>{this.loop(),this.createCanvasBackground()})),this}resetVideoWrapper(){const e=document.getElementById("video-wrapper");e&&(e.innerHTML="")}removeCanvas(){const e=document.getElementsByTagName("canvas")[0];e&&e.remove()}responsiveFrameBoxEyesOutterWidth(e){switch(e){case 315:return{eyesInner:.74,eyesOutter:.78,box:.55};default:return{eyesInner:.52,eyesOutter:.82,box:.6}}}loop(){this.video.style.width.includes("%")&&(this.displaySize.width=this.video.style.width=this.video.clientWidth,this.displaySize.height=this.video.style.height=this.video.clientHeight),this.canvas=this.faceapi.createCanvasFromMedia(this.video),this.canvas.style.position="absolute",this.canvas.style.left=0,this.canvas.style.top=0,this.videoWrapper.append(this.canvas),this.faceapi.matchDimensions(this.canvas,this.displaySize),this.boxesWidth=this.responsiveFrameBoxEyesOutterWidth(window.innerWidth),this.configFrameBox&&(this.boxesWidth=this.configFrameBox);const e={width:Math.floor(this.config.width*this.boxesWidth.box),height:Math.floor(.922*this.config.height)};e.left=Math.floor(this.canvas.width/2-e.width/2),e.top=Math.floor(this.videoWrapper.clientHeight/2-e.height/2);const t=e.height+this.configEyesBoxHeight,i={width:Math.floor(e.width*this.boxesWidth.eyesOutter),height:Math.floor(t/5)};i.left=Math.floor(e.left+e.width/1.95-i.width/1.95),i.top=Math.floor(e.top+.3*e.height);const n={width:Math.floor(e.width*this.boxesWidth.eyesInner),height:Math.floor(t/5)};n.left=Math.floor(e.left+e.width/1.96-n.width/1.96),n.top=Math.floor(e.top+.3*e.height),this.ellipseMaskWidth=n.height+.3*n.height,this.ellipseMaskHeight=e.width/2,this.ellipseMaskTop=i.top+i.height/1.4,this.ellipseMaskLeft=i.left+i.width/2,this.ellipseMaskLineWidth=2;const s=this.canvas.getContext("2d");s.translate(this.canvas.width,0),s.scale(-1,1),this.drawEllipse(s),this.config.isDebug&&this.draw(s,this.canvas,e,n,i),this.isMobile()?this.isBackgroundOK=!0:this.timerBackground=setInterval((()=>{this.checkBackground()}),1e3);const o={counter:0,inProgress:!1,done:!1},a=this.canvas.getBoundingClientRect();this.timer=setInterval((async()=>{if(!navigator.onLine)return void this.setHasNoNetwork();if(o.inProgress||o.done)return;o.inProgress=!0;const t=await this.faceapi.detectSingleFace(this.video,new this.faceapi.TinyFaceDetectorOptions).withFaceLandmarks().withFaceExpressions();if(this.removeLoading(),!t)return this.blockMask("Face não encontrada",a,e.left,e.top,e.height,e.width),o.counter=0,void(o.inProgress=!1);const r=this.faceapi.resizeResults(t,this.displaySize);if(r&&r.expressions){const t=this.getExpression(r.expressions);if("neutral"!==t)return this.config.isDebug?this.blockMask(`Mantenha expressão neutra >> ${t}`,a,e.left,e.top,e.height,e.width):this.blockMask("Mantenha expressão neutra",a,e.left,e.top,e.height,e.width),o.counter=0,void(o.inProgress=!1)}if(r.detection){const t=this.getPose(r);if("front"!==t)return this.config.isDebug?this.blockMask(`Centralize seu rosto >> ${t}`,a,e.left,e.top,e.height,e.width):this.blockMask("Centralize seu rosto",a,e.left,e.top,e.height,e.width),o.counter=0,void(o.inProgress=!1);const h=r.landmarks.getJawOutline();if(this.isRotatedFace(h[0],h[16]))return this.config.isDebug?this.blockMask("Centralize seu rosto >> rotacionado",a,e.left,e.top,e.height,e.width):this.blockMask("Centralize seu rosto",a,e.left,e.top,e.height,e.width),o.counter=0,void(o.inProgress=!1);this.config.isDebug&&(this.draw(s,this.canvas,e,n,i),s.beginPath(),s.lineWidth="5",s.strokeStyle="#FFFF00",s.moveTo(h[0].x,h[0].y),s.lineTo(h[16].x,h[16].y),s.stroke());const d={meanPosition:[h[0].x,h[0].y],frameBox:{isInside:!1},outterBox:{isInside:!1},innerBox:{isInside:!1}},l={meanPosition:[h[16].x,h[16].y],frameBox:{isInside:!1},outterBox:{isInside:!1},innerBox:{isInside:!1}};if(d.frameBox.isInside=this.isInside(d.meanPosition,{top:e.top,left:e.left,width:e.width,height:e.height}),l.frameBox.isInside=this.isInside(l.meanPosition,{top:e.top,left:e.left,width:e.width,height:e.height}),d.outterBox.isInside=this.isInside(d.meanPosition,{top:i.top,left:i.left,width:i.width,height:i.height}),l.outterBox.isInside=this.isInside(l.meanPosition,{top:i.top,left:i.left,width:i.width,height:i.height}),d.innerBox.isInside=this.isInside(d.meanPosition,{top:n.top,left:n.left,width:n.width,height:n.height}),l.innerBox.isInside=this.isInside(l.meanPosition,{top:n.top,left:n.left,width:n.width,height:n.height}),!this.isBackgroundOK)return this.blockMask("O ambiente está escuro",a,e.left,e.top,e.height,e.width),o.counter=0,void(o.inProgress=!1);if(!d.frameBox.isInside||!l.frameBox.isInside)return this.blockMask("Posicione seu rosto dentro da moldura",a,e.left,e.top,e.height,e.width),o.counter=0,void(o.inProgress=!1);if(!d.outterBox.isInside||!l.outterBox.isInside)return this.blockMask("Afaste seu rosto",a,e.left,e.top,e.height,e.width),o.counter=0,void(o.inProgress=!1);if(d.innerBox.isInside||l.innerBox.isInside)return this.blockMask("Aproxime seu rosto",a,e.left,e.top,e.height,e.width),o.counter=0,void(o.inProgress=!1);this.ellipseMaskLineWidth*=2,this.activateEllipseMask(),o.counter+=1,o.inProgress=!1,o.counter>=2&&(o.done=!0,this.takePicture(),clearInterval(this.timer),this.timerBackground&&clearInterval(this.timerBackground))}}),150)}activateEllipseMask(){const e=this.canvas.getContext("2d");this.drawEllipse(e,this.activatedEllipseStrokeStyle)}deactivateEllipseMask(){const e=this.canvas.getContext("2d");this.ellipseMaskLineWidth=3,this.drawEllipse(e)}draw(e,t,i,n,s){e.clearRect(0,0,t.width,t.height),e.beginPath(),e.lineWidth=3,e.strokeStyle="blue",e.rect(i.left,i.top,i.width,i.height),e.stroke(),e.beginPath(),e.lineWidth=2,e.strokeStyle="yellow",e.rect(n.left,n.top,n.width,n.height),e.stroke(),e.beginPath(),e.lineWidth=2,e.strokeStyle="red",e.rect(s.left,s.top,s.width,s.height),e.stroke(),this.drawEllipse(e)}drawEllipse(e,t){const i=this.ellipseMaskLeft,n=this.ellipseMaskTop,s=this.ellipseMaskWidth,o=this.ellipseMaskHeight;e.beginPath(),e.lineWidth=this.ellipseMaskLineWidth,e.ellipse(i,n,s,o,0,0,2*Math.PI),e.strokeStyle=t||this.ellipseStrokeStyleDefault,e.stroke()}getExpression(e){const t=[];for(const[i,n]of Object.entries(e))t.push({expression:i,confidence:n});const i=t.sort(((e,t)=>e.confidence-t.confidence)).pop();return i&&i.expression?i.expression:null}getPose(e){const t=this.getMeanPosition(e.landmarks.getRightEye()),i=this.getMeanPosition(e.landmarks.getLeftEye()),n=this.getMeanPosition(e.landmarks.getNose()),s=this.getMeanPosition(e.landmarks.getMouth()),o=(this.getTop(e.landmarks.getJawOutline())-s[1])/e.detection.box.height+.45,a=(i[0]+(t[0]-i[0])/2-n[0])/e.detection.box.width;let r="undetected";return e.detection.score>.3&&(r="front",o>.2?r="top":o<-.1?r="bottom":(a<-.04&&(r="left"),a>.04&&(r="right"))),r}isRotatedFace(e,t){return Math.abs(180*Math.atan2(t.y-e.y,t.x-e.x)/Math.PI)>7}getMeanPosition(e){return e.map((e=>[e.x,e.y])).reduce(((e,t)=>[e[0]+t[0],e[1]+t[1]])).map((t=>t/e.length))}getTop(e){return e.map((e=>e.y)).reduce(((e,t)=>Math.min(e,t)))}isInside(e=[],t={}){return!(e[1]<t.top||e[0]<t.left||e[1]>t.top+t.height||e[0]>t.left+t.width)}blockMask(e,t,i,n,s,o){const a={width:230,height:35};a.top=n+s+20,a.left=i+o/2-a.width/2,this.deactivateEllipseMask(),this.removeMessageBox(),this.createMessageBox(),this.msg.innerHTML="";const r=document.createElement("span");r.textContent=e,r.style=`\n      display: flex;\n      color: ${this.boxMessageTextColor};\n      z-index: 20;\n      font-size: 1.1rem;\n      padding: 10px 20px;\n      text-align: center;\n      align-items: center;\n      background: ${this.boxMessageBackgroundColor};\n      border-radius: 7px;\n      justify-content: center;\n      width: ${a.width}px;\n      height: ${a.height}px;\n      font-family: Prompt, sans-serif;\n    `,this.msg.style.display="flex",this.msg.appendChild(r)}takePicture(){const e=this.canvasBackground.getContext("2d");this.canvasBackground.style.display="none;",this.createFlashMask(),e.drawImage(this.video,0,0,this.canvasBackground.width,this.canvasBackground.height),e.fillStyle="rgb(71,84,68)",e.fillRect(20,50,1,1),e.fillStyle="rgb(211,190,124)",e.fillRect(422,522,1,1);const t=e.getImageData(0,0,this.canvasBackground.width,this.canvasBackground.height);e.putImageData(t,0,0),this.base64=this.canvasBackground.toDataURL("image/png"),setTimeout((()=>{this.removeFlashMask(),this.handleBeforeSubmitFunction?this.handleBeforeSubmitFunction():this.isShowPreview?this.openPreviewModal():this.submitImage()}),300)}checkBackground(){this.canvasLuminance=document.createElement("canvas"),this.videoWrapper.clientWidth,this.videoWrapper.clientHeight;const e=this.canvasLuminance.getContext("2d");e.drawImage(this.video,0,0,this.canvasLuminance.width,this.canvasLuminance.height);const t=e.getImageData(0,0,this.canvasLuminance.width,this.canvasLuminance.height);if(this.sweepVideo(t.data),this.isBackgroundOK=this.brightness>=this.brightnessControl&&this.luminance>=this.luminanceControl,this.config.isDebug){const e={brilho:{atual:this.brightness,"mín aceitável":this.brightnessControl},luminânia:{atual:parseFloat(this.luminance.toFixed(2)),"mín aceitável":this.luminanceControl}};console.table(e)}}createFlashMask(){const e=document.createElement("div");e.style.width="100%",e.style.height="100vh",e.style.position="fixed",e.style.background="white",e.style.zIndex=30,e.style.top=0,e.style.left=0,e.id="flash",document.body.append(e)}removeFlashMask(){document.getElementById("flash").remove()}removeMessageBox(){const e=document.getElementById("liveness-box-message");e&&e.remove()}createMessageBox(){return this.msg=document.createElement("div"),this.msg.id="liveness-box-message",this.msg.style=`\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      width: 100%;\n      background: transparent;\n      position: absolute;\n      top: ${this.ellipseMaskTop+this.ellipseMaskHeight}px;\n    `,this.videoWrapper.append(this.msg),this}createModalConfirmationWrapper(){return this.modalWrapper=document.createElement("div"),this.modalWrapper.style="\n    top: 0;\n    left: 0;\n    z-index: 21;\n    width: 100%;\n    height: 100%;\n    display: none;\n    position: fixed;\n    align-items: flex-start;\n    justify-content: center;\n    background: rgba(20, 20, 20, 0.95);\n    ",this.modalWrapper.id="modalWrapper",document.body.append(this.modalWrapper),this}createModalConfirmation(){this.modalConfirmation=document.createElement("div"),this.modalConfirmation.style="\n    padding: 7px;\n    display: flex;\n    max-width: 720px;\n    background: white;\n    max-height: 560px;\n    border-radius: 7px;\n    position: relative;\n    align-items: center;\n    justify-content: center;\n    ";const e=document.createElement("button");e.textContent="Confirmar",e.style="\n    color: #555;\n    right: 10px;\n    width: 160px;\n    height: 50px;\n    bottom: 10px;\n    cursor: pointer;\n    background: #fff;\n    font-weight: 600;\n    border-radius: 7px;\n    margin-right: 10px;\n    border: 1px solid #222;\n    ";const t=document.createElement("button");t.textContent="Cancelar",t.style="\n    color: #444;\n    right: 10px;\n    width: 160px;\n    height: 50px;\n    bottom: 10px;\n    cursor: pointer;\n    background: #fff;\n    font-weight: 600;\n    border-radius: 7px;\n    margin-right: 10px;\n    border: 1px solid #222;\n    ";const i=document.createElement("div");return i.style="\n    right: 0;\n    bottom: 0;\n    z-index: 1;\n    width: 100%;\n    display: flex;\n    padding: 10px 0;\n    position: absolute;\n    justify-content: center;\n    ",i.append(t),i.append(e),this.modalConfirmation.append(i),this.modalWrapper.append(this.modalConfirmation),e.addEventListener("click",(()=>{this.closePreviewModal(),this.submitImage()})),t.addEventListener("click",(()=>{this.cancelPicture()})),this}openPreviewModal(){const e=document.createElement("img");e.src=this.base64,e.style=`\n    width: 100%;\n    height: 100%;\n    max-width: ${this.videoWrapper.clientWidth};\n    object-fit: cover;\n    border-radius: 7px;\n    transform: scaleX(-1);\n    `,this.modalConfirmation.append(e),this.modalWrapper.style.display="flex"}closePreviewModal(){const e=document.getElementById("modalWrapper");e&&e.remove()}cancelPicture(){this.resetLiveness()}downloadImage(){const e=createElement("a");e.setAttribute("download","image.png"),e.setAttribute("href",this.base64),e.click(),setTimeout((()=>{e.remove()}),1e3)}setLoading(){document.getElementById("spinner")||this.videoWrapper.insertAdjacentHTML("beforeend",'<div id="spinner">\n        <div class="lds-ripple">\n          <div style="color: white"></div>\n          <div style="color: white"></div>\n        </div>\n        <div id="spinner-message" />\n        <style>\n        #spinner {\n          top: 0;\n          z-index: 40;\n          width: 100%;\n          height: 100%;\n          display: flex;\n          position: absolute;\n          align-items: center;\n          flex-direction: column;\n          justify-content: center;\n          background: rgba(20, 20, 20, 1);\n        }\n        #spinner-message {\n          width: 100%;\n          display: flex;\n        }\n        .lds-ripple {\n          width: 80px;\n          height: 80px;\n          position: relative;\n        }\n        .lds-ripple div {\n          position: absolute;\n          border: 4px solid #000;\n          opacity: 1;\n          border-radius: 50%;\n          border-color: white;\n          animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;\n        }\n        .lds-ripple div:nth-child(2) {\n          animation-delay: -0.5s;\n        }\n        @keyframes lds-ripple {\n          0% {\n            top: 36px;\n            left: 36px;\n            width: 0;\n            height: 0;\n            opacity: 1;\n            color: white;\n          }\n          100% {\n            top: 0px;\n            left: 0px;\n            width: 72px;\n            height: 72px;\n            opacity: 0;\n          }\n        }\n        </style>\n      </div>')}setLoadingProgress(){if(document.getElementById("spinner"))return;const e=`<div id="spinner">\n        <p class="liveness-progress-text">\n          ${100===this.uploadInProgress?"<strong>Aguarde enquanto estamos <br /> analisando a sua selfie</strong>":`Fazendo upload da selfie...<br /> (${this.uploadInProgress?.toFixed(0)}% enviados)`}\n        </p>\n    \n        <style>\n        #spinner {\n          top: 0;\n          z-index: 40;\n          width: 100%;\n          height: 100%;\n          display: flex;\n          position: absolute;\n          align-items: center;\n          flex-direction: column;\n          justify-content: center;\n          background: rgba(20, 20, 20, 1);\n        }\n        .liveness-progress-text {\n          color: white;\n          text-align: center;\n        }\n        .liveness-progress-text strong {\n          opacity: 1;\n          animation: blink-text 1s ease infinite alternate;\n        }\n        @keyframes blink-text {\n          from {\n            opacity: 1;\n          }\n          to {\n            opacity: 0.4;\n          }\n        }\n        </style>\n      </div>`;this.videoWrapper.insertAdjacentHTML("beforeend",e)}removeLoading(){const e=document.getElementById("spinner");e&&e.remove()}setHasNoNetwork(){document.getElementById("spinner")||this.videoWrapper.insertAdjacentHTML("beforeend",'<div id="spinner">\n        <div class="lds-ripple">\n          <div style="color: white"></div>\n          <div style="color: white"></div>\n        </div>\n        <p>Estamos sem conexão<br />com a internet</p>\n        <style>\n        #spinner {\n          top: 0;\n          z-index: 40;\n          width: 100%;\n          height: 100%;\n          display: flex;\n          position: absolute;\n          align-items: center;\n          flex-direction: column;\n          justify-content: center;\n          background: rgba(20, 20, 20, 1);\n        }\n        .lds-ripple {\n          width: 80px;\n          height: 80px;\n          position: relative;\n        }\n        .lds-ripple div {\n          position: absolute;\n          border: 4px solid #000;\n          opacity: 1;\n          border-radius: 50%;\n          border-color: white;\n          animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;\n        }\n        .lds-ripple div:nth-child(2) {\n          animation-delay: -0.5s;\n        }\n        #spinner p {\n          color: white;\n          text-align: center;\n          animation: blink 1s linear infinite;\n        }\n\n        @keyframes blink {\n          0% {\n            opacity: 1;\n          }\n          100% {\n            opacity: 0.2;\n          }\n        }\n        @keyframes lds-ripple {\n          0% {\n            top: 36px;\n            left: 36px;\n            width: 0;\n            height: 0;\n            opacity: 1;\n            color: white;\n          }\n          100% {\n            top: 0px;\n            left: 0px;\n            width: 72px;\n            height: 72px;\n            opacity: 0;\n          }\n        }\n        </style>\n      </div>')}async sendPictureByXmlRequest(){const e=`${this.livenessUrlBase}${this.livenessConfirmEndpoint}`,t=new XMLHttpRequest;t.open("POST",e,!0),t.setRequestHeader("Authorization",`Bearer ${this.token}`),t.upload.addEventListener("progress",(e=>{this.uploadInProgress=e.loaded/e.total*100,this.removeLoading(),this.setLoadingProgress()})),t.onreadystatechange=()=>{if(t.readyState===XMLHttpRequest.DONE){const e=JSON.parse(t?.response);switch(t.status){case 200:this.successCallback({...e,base64:this.base64});break;case 401:default:this.errorCallback({error:e,base64:this.base64})}this.resetLiveness(),this.removeLoading()}},"b64"===this.requestType?await this.sendBase64(t):await this.sendFormData(t)}async sendBase64(e){e.setRequestHeader("Content-Type","application/json"),e.send(JSON.stringify({base64:{key:this.toB64()}}))}async sendFormData(e){const t=await this.toFormData();e.send(t)}async toFormData(){const e=new FormData,t=await fetch(this.base64),i=await t.blob();return e.append("selfie",i,"image.png"),e}toB64(){return this.base64.split(",")[1]}submitImage(){this.sendPictureByXmlRequest()}}}},t={},i=function i(n){var s=t[n];if(void 0!==s)return s.exports;var o=t[n]={exports:{}};return e[n](o,o.exports,i),o.exports}(258);Liveness=i})();
//# sourceMappingURL=liveness.js.map