var Liveness;(()=>{"use strict";var e={417:e=>{e.exports=class{constructor(e,t){const i=window.innerWidth;t.width>=i&&(t.width=i),t.height=Math.floor(.7778*t.width),this.config=t,this.token=t.token,this.videoWrapper=e,this.faceapi=null,this.configFrameBox=t.frameBox;const s=document.createElement("style");s.innerText=this.cssOrientationLock(),document.head.appendChild(s),t.brightnessControl?this.brightnessControl=t.brightnessControl:this.brightnessControl=95,t.luminanceControl?this.luminanceControl=t.luminanceControl:this.luminanceControl=23,this.faceapiPath=t.faceapiPath,this.isShowPreview=t.isShowPreview,this.errorCallback=t.errorCallback,this.successCallback=t.successCallback,this.livenessUrlBase=t.livenessUrlBase,this.displaySize={width:t.width,height:t.height},this.livenessConfirmEndpoint=t.livenessConfirmEndpoint||"/liveness/v2"}setMinBrightness(e){this.brightnessControl=e}setMinLuminance(e){this.luminanceControl=e}setFrameBoxesWidth(e,t,i){this.configFrameBox={eyesInner:e,eyesOutter:t,box:i}}setEyesBoxHeight(e){this.configEyesBoxHeight=e}stop(){this.video.pause(),this.stream.getTracks().forEach((e=>e.stop()))}async start(){window.faceapi?(this.faceapi=window.faceapi,this.setLiveness()):await this.loadFaceApi()}setLiveness(){this.setLoading(),this.createModalConfirmationWrapper().createModalConfirmation().createVideoElement().startVideo()}resetLiveness(){this.removeCanvas(),this.resetVideoWrapper(),this.closePreviewModal(),this.base64="",this.removeLoading(),this.setLiveness()}cssOrientationLock(){return"@media screen and (min-width: 320px) and (max-width: 767px) and (orientation: landscape) { html { transform: rotate(-90deg);transform-origin: left top;width: 100vh;overflow-x: hidden;position: absolute;top: 100%;left: 0;}}"}createCanvasBackground(){this.canvasBackground=document.createElement("canvas");const e=this.videoWrapper.clientWidth,t=this.videoWrapper.clientHeight;window.innerWidth<720?(this.canvasBackground.width=2*e,this.canvasBackground.height=2*t):(this.canvasBackground.width=e,this.canvasBackground.height=t),this.canvasBackground.style.display="none"}sweepVideo(e){this.luminanceAvg=0,this.brightnessSum=0,this.luminanceArray=[];for(let t=0;t<e.length;t+=4){const i=e[t],s=e[t+1],n=e[t+2];this.sweepBrightness(i,s,n),this.sweepLuminance(i,s,n)}this.checkBrightness()}checkBrightness(){this.brightness=Math.floor(this.brightnessSum/(this.canvasBackground.width*this.canvasBackground.height))}sweepBrightness(e,t,i){this.brightnessSum+=Math.floor((e+t+i)/3)}sweepLuminance(e,t,i){this.luminanceAvg+=this.calcLuminance(e,t,i),this.luminanceArray.push(this.calcLuminance(e,t,i)),this.luminance=this.luminanceAvg/this.luminanceArray?.length*100}calcLuminance(e,t,i){let s,n=[e,t,i];for(let e=0;e<n.length;e++)s=n[e]/255,s<=.03928?s/=12.92:s=Math.pow((s+.055)/1.055,2.4),n[e]=s;return.2126*n[0]+.7152*n[1]+.0722*n[2]+.05}async loadFaceApi(){const e=document.createElement("script"),t=`${this.faceapiPath}/face-api.min.js`;return e.src=t,document.head.append(e),e.onload=async()=>{await this.loadFaceApiModels()},this}async loadFaceApiModels(){return setTimeout((async()=>{Promise.all([window.faceapi.nets.faceLandmark68Net.loadFromUri(this.faceapiPath),window.faceapi.nets.faceExpressionNet.loadFromUri(this.faceapiPath),window.faceapi.nets.faceRecognitionNet.loadFromUri(this.faceapiPath)]).then((async()=>{await window.faceapi.nets.tinyFaceDetector.loadFromUri(this.faceapiPath),console.log("Models were loaded"),this.faceapi=faceapi,this.setLiveness()})).catch((e=>console.log("errando",e)))}),100),this}startVideo(){return void 0===navigator.mediaDevices&&(navigator.mediaDevices={}),void 0===navigator.mediaDevices.getUserMedia&&(navigator.mediaDevices.getUserMedia=function(e){const t=navigator.webkitGetUserMedia||navigator.mozGetUserMedia;return t?new Promise((function(i,s){t.call(navigator,e,i,s)})):Promise.reject(new Error("getUserMedia não implementado nesse browser"))}),navigator.mediaDevices.getUserMedia({video:{width:this.config.width,height:this.config.height,frameRate:24}}).then((e=>{const t=document.querySelector("video");this.stream=e,"srcObject"in t?t.srcObject=e:t.src=window.URL.createObjectURL(e)})).catch((e=>console.error(e))),this}createVideoElement(){return this.video=document.createElement("video"),this.video.style.width="100%",this.video.style.height="100%",this.video.style.transform="scaleX(-1)",this.video.setAttribute("muted",!0),this.video.setAttribute("autoplay",!0),this.video.setAttribute("playsinline",""),this.videoWrapper.style.position="relative",this.videoWrapper.style.width=this.config.width,this.videoWrapper.style.height=this.config.height,this.videoWrapper.append(this.video),this.video.addEventListener("play",(()=>{this.createMessageBox(),this.loop(),this.createCanvasBackground()})),this}resetVideoWrapper(){const e=document.getElementById("video-wrapper");e&&(e.innerHTML="")}removeCanvas(){const e=document.getElementsByTagName("canvas")[0];e&&e.remove()}responsiveFrameBoxEyesOutterWidth(e){switch(e){case 818:return{eyesInner:.74,eyesOutter:.78,box:.6};case 414:return{eyesInner:.68,eyesOutter:.72,box:.6};case 412:return{eyesInner:.68,eyesOutter:.69,box:.6};case 375:return{eyesInner:.67,eyesOutter:.69,box:.57};case 360:return{eyesInner:.63,eyesOutter:.67,box:.57};case 320:return{eyesInner:.62,eyesOutter:.67,box:.57};case 315:return{eyesInner:.74,eyesOutter:.78,box:.55};default:return{eyesInner:.74,eyesOutter:.8,box:.515}}}loop(){this.video.style.width.includes("%")&&(this.displaySize.width=this.video.style.width=this.video.clientWidth,this.displaySize.height=this.video.style.height=this.video.clientHeight),this.canvas=this.faceapi.createCanvasFromMedia(this.video),this.canvas.style.position="absolute",this.canvas.style.left=0,this.canvas.style.top=10,this.canvas.style.width=this.videoWrapper.style.width,this.canvas.height=this.videoWrapper.clientHeight,this.canvas.style.height=this.videoWrapper.clientHeight,this.canvas.style.minHeight=this.videoWrapper.clientHeight,this.videoWrapper.append(this.canvas),this.faceapi.matchDimensions(this.canvas,this.displaySize),this.boxesWidth=this.responsiveFrameBoxEyesOutterWidth(window.innerWidth),this.configFrameBox&&(this.boxesWidth=this.configFrameBox);const e={width:Math.floor(this.config.width*this.boxesWidth.box),height:Math.floor(.922*this.config.height)};e.left=Math.floor(this.canvas.width/2-e.width/2),e.top=Math.floor(this.videoWrapper.clientHeight/2-e.height/2);const t=this.configEyesBoxHeight?e.height+this.configEyesBoxHeight:e.height,i={width:Math.floor(e.width*this.boxesWidth.eyesOutter),height:Math.floor(t/5)};i.left=Math.floor(e.left+e.width/1.95-i.width/1.95),i.top=Math.floor(e.top+.3*e.height);const s={width:Math.floor(e.width*this.boxesWidth.eyesInner),height:Math.floor(t/5)};s.left=Math.floor(e.left+e.width/1.96-s.width/1.96),s.top=Math.floor(e.top+.3*e.height),this.ellipseMaskWidth=s.height+.3*s.height,this.ellipseMaskHeight=e.width/2,this.ellipseMaskTop=i.top+i.height/1.4,this.ellipseMaskLeft=i.left+i.width/2,this.ellipseMaskLineWidth=2;const n=this.canvas.getContext("2d");n.translate(this.canvas.width,0),n.scale(-1,1),this.drawEllipse(n),this.config.isDebug&&this.draw(n,this.canvas,e,s,i);const o=this.canvas.getBoundingClientRect(),a={counter:0,inProgress:!1,done:!1},r=setInterval((()=>{this.checkBackground()}),1e3),h=setInterval((async()=>{if(a.inProgress||a.done)return;a.inProgress=!0;const t=await this.faceapi.detectSingleFace(this.video,new this.faceapi.TinyFaceDetectorOptions).withFaceLandmarks().withFaceExpressions();if(this.removeLoading(),!t)return this.blockMask("Face não encontrada",o,e.left,e.top,e.height,e.width),a.counter=0,void(a.inProgress=!1);const d=this.faceapi.resizeResults(t,this.displaySize);if(d&&d.expressions){const t=this.getExpression(d.expressions);if("neutral"!==t)return this.config.isDebug?this.blockMask(`Mantenha expressão neutra >> ${t}`,o,e.left,e.top,e.height,e.width):this.blockMask("Mantenha expressão neutra",o,e.left,e.top,e.height,e.width),a.counter=0,void(a.inProgress=!1)}if(d.detection){const t=this.getPose(d);if("front"!==t)return this.config.isDebug?this.blockMask(`Centralize seu rosto >> ${t}`,o,e.left,e.top,e.height,e.width):this.blockMask("Centralize seu rosto",o,e.left,e.top,e.height,e.width),a.counter=0,void(a.inProgress=!1);const c=d.landmarks.getJawOutline();if(this.isRotatedFace(c[0],c[16]))return this.config.isDebug?this.blockMask("Centralize seu rosto >> rotacionado",o,e.left,e.top,e.height,e.width):this.blockMask("Centralize seu rosto",o,e.left,e.top,e.height,e.width),a.counter=0,void(a.inProgress=!1);this.config.isDebug&&(this.draw(n,this.canvas,e,s,i),n.beginPath(),n.lineWidth="5",n.strokeStyle="#FFFF00",n.moveTo(c[0].x,c[0].y),n.lineTo(c[16].x,c[16].y),n.stroke());const l={meanPosition:[c[0].x,c[0].y],frameBox:{isInside:!1},outterBox:{isInside:!1},innerBox:{isInside:!1}},p={meanPosition:[c[16].x,c[16].y],frameBox:{isInside:!1},outterBox:{isInside:!1},innerBox:{isInside:!1}};if(l.frameBox.isInside=this.isInside(l.meanPosition,{top:e.top,left:e.left,width:e.width,height:e.height}),p.frameBox.isInside=this.isInside(p.meanPosition,{top:e.top,left:e.left,width:e.width,height:e.height}),l.outterBox.isInside=this.isInside(l.meanPosition,{top:i.top,left:i.left,width:i.width,height:i.height}),p.outterBox.isInside=this.isInside(p.meanPosition,{top:i.top,left:i.left,width:i.width,height:i.height}),l.innerBox.isInside=this.isInside(l.meanPosition,{top:s.top,left:s.left,width:s.width,height:s.height}),p.innerBox.isInside=this.isInside(p.meanPosition,{top:s.top,left:s.left,width:s.width,height:s.height}),!this.isBackgroundOK)return this.blockMask("O ambiente está escuro",o,e.left,e.top,e.height,e.width),a.counter=0,void(a.inProgress=!1);if(!l.frameBox.isInside||!p.frameBox.isInside)return this.blockMask("Posicione seu rosto dentro da moldura",o,e.left,e.top,e.height,e.width),a.counter=0,void(a.inProgress=!1);if(!l.outterBox.isInside||!p.outterBox.isInside)return this.blockMask("Afaste seu rosto",o,e.left,e.top,e.height,e.width),a.counter=0,void(a.inProgress=!1);if(l.innerBox.isInside||p.innerBox.isInside)return this.blockMask("Aproxime seu rosto",o,e.left,e.top,e.height,e.width),a.counter=0,void(a.inProgress=!1);this.ellipseMaskLineWidth*=2,this.activateEllipseMask(),a.counter+=1,a.inProgress=!1,a.counter>=2&&(a.done=!0,this.takePicture(this.canvas),clearInterval(h),clearInterval(r))}}),150)}activateEllipseMask(){const e=this.canvas.getContext("2d");this.drawEllipse(e,"#46E3C3")}deactivateEllipseMask(){const e=this.canvas.getContext("2d");this.ellipseMaskLineWidth=3,this.drawEllipse(e)}draw(e,t,i,s,n){e.clearRect(0,0,t.width,t.height),e.beginPath(),e.lineWidth=3,e.strokeStyle="blue",e.rect(i.left,i.top,i.width,i.height),e.stroke(),e.beginPath(),e.lineWidth=2,e.strokeStyle="yellow",e.rect(s.left,s.top,s.width,s.height),e.stroke(),e.beginPath(),e.lineWidth=2,e.strokeStyle="red",e.rect(n.left,n.top,n.width,n.height),e.stroke(),this.drawEllipse(e)}drawEllipse(e,t="#D02780"){const i=this.ellipseMaskLeft,s=this.ellipseMaskTop,n=this.ellipseMaskWidth,o=this.ellipseMaskHeight;e.beginPath(),e.lineWidth=this.ellipseMaskLineWidth,e.ellipse(i,s,n,o,0,0,2*Math.PI),t&&(e.strokeStyle=t),e.stroke()}getExpression(e){const t=[];for(const[i,s]of Object.entries(e))t.push({expression:i,confidence:s});const i=t.sort(((e,t)=>e.confidence-t.confidence)).pop();return i&&i.expression?i.expression:null}getPose(e){const t=this.getMeanPosition(e.landmarks.getRightEye()),i=this.getMeanPosition(e.landmarks.getLeftEye()),s=this.getMeanPosition(e.landmarks.getNose()),n=this.getMeanPosition(e.landmarks.getMouth()),o=(this.getTop(e.landmarks.getJawOutline())-n[1])/e.detection.box.height+.45,a=(i[0]+(t[0]-i[0])/2-s[0])/e.detection.box.width;let r="undetected";return e.detection.score>.3&&(r="front",o>.2?r="top":o<-.1?r="bottom":(a<-.04&&(r="left"),a>.04&&(r="right"))),r}isRotatedFace(e,t){return Math.abs(180*Math.atan2(t.y-e.y,t.x-e.x)/Math.PI)>7}getMeanPosition(e){return e.map((e=>[e.x,e.y])).reduce(((e,t)=>[e[0]+t[0],e[1]+t[1]])).map((t=>t/e.length))}getTop(e){return e.map((e=>e.y)).reduce(((e,t)=>Math.min(e,t)))}isInside(e=[],t={}){return!(e[1]<t.top||e[0]<t.left||e[1]>t.top+t.height||e[0]>t.left+t.width)}blockMask(e,t,i,s,n,o){const a={width:230,height:35};a.top=s+n+20,a.left=i+o/2-a.width/2,this.deactivateEllipseMask(),this.msg.innerHTML="";const r=document.createElement("span");r.textContent=e,r.style=`\n      display: flex;\n      color: #f3f3f5;\n      z-index: 20;\n      font-size: 1.1rem;\n      padding: 10px 20px;\n      text-align: center;\n      align-items: center;\n      background: #D02780;\n      border-radius: 7px;\n      justify-content: center;\n      width: ${a.width}px;\n      height: ${a.height}px;\n      font-family: Prompt, sans-serif;\n    `,this.msg.style.display="flex",this.msg.appendChild(r)}takePicture(e){const t=this.canvasBackground.getContext("2d");this.canvasBackground.style.display="none;",this.createFlashMask(),t.drawImage(this.video,0,0,this.canvasBackground.width,this.canvasBackground.height),this.base64=this.canvasBackground.toDataURL("image/png"),setTimeout((()=>{this.removeFlashMask(),this.isShowPreview?this.openPreviewModal():this.confirmPicture()}),300)}checkBackground(){if(!this.canvasBackground)return;const e=this.canvasBackground.getContext("2d");e.drawImage(this.video,0,0,this.canvasBackground.width,this.canvasBackground.height);const t=e.getImageData(0,0,this.canvasBackground.width,this.canvasBackground.height);if(this.sweepVideo(t.data),this.isBackgroundOK=this.brightness>=this.brightnessControl&&this.luminance>=this.luminanceControl,this.config.isDebug){const e={brilho:{atual:this.brightness,"mín aceitável":this.brightnessControl},luminânia:{atual:parseFloat(this.luminance.toFixed(2)),"mín aceitável":this.luminanceControl}};console.table(e)}}createFlashMask(){const e=document.createElement("div");e.style.width="100%",e.style.height="100vh",e.style.position="fixed",e.style.background="white",e.style.zIndex=30,e.style.top=0,e.style.left=0,e.id="flash",document.body.append(e)}removeFlashMask(){document.getElementById("flash").remove()}createMessageBox(){return this.msg=document.createElement("div"),this.msg.style="\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      width: 100%;\n      background: transparent;\n      position: absolute;\n      bottom: 0;\n    ",this.videoWrapper.append(this.msg),this}createModalConfirmationWrapper(){return this.modalWrapper=document.createElement("div"),this.modalWrapper.style="\n    top: 0;\n    left: 0;\n    z-index: 10;\n    width: 100%;\n    height: 100%;\n    display: none;\n    position: fixed;\n    align-items: center;\n    justify-content: center;\n    background: rgba(20, 20, 20, 0.95);\n    ",this.modalWrapper.id="modalWrapper",document.body.append(this.modalWrapper),this}createModalConfirmation(){this.modalConfirmation=document.createElement("div"),this.modalConfirmation.style="\n    padding: 7px;\n    display: flex;\n    max-width: 720px;\n    background: white;\n    max-height: 560px;\n    border-radius: 7px;\n    position: relative;\n    align-items: center;\n    justify-content: center;\n    ";const e=document.createElement("button");e.textContent="Confirmar",e.style="\n    color: #555;\n    right: 10px;\n    width: 160px;\n    height: 50px;\n    bottom: 10px;\n    cursor: pointer;\n    background: #fff;\n    font-weight: 600;\n    border-radius: 7px;\n    margin-right: 10px;\n    border: 1px solid #222;\n    ";const t=document.createElement("button");t.textContent="Cancelar",t.style="\n    color: #444;\n    right: 10px;\n    width: 160px;\n    height: 50px;\n    bottom: 10px;\n    cursor: pointer;\n    background: #fff;\n    font-weight: 600;\n    border-radius: 7px;\n    margin-right: 10px;\n    border: 1px solid #222;\n    ";const i=document.createElement("div");return i.style="\n    right: 0;\n    bottom: 0;\n    width: 100%;\n    display: flex;\n    padding: 10px 0;\n    position: absolute;\n    justify-content: center;\n    ",i.append(t),i.append(e),this.modalConfirmation.append(i),this.modalWrapper.append(this.modalConfirmation),e.addEventListener("click",(()=>{this.closePreviewModal(),this.confirmPicture()})),t.addEventListener("click",(()=>{this.cancelPicture()})),this}openPreviewModal(){const e=document.createElement("img");e.src=this.base64,e.style=`\n      max-width: ${this.canvasBackground.width};\n      min-width: ${this.canvasBackground.width};\n      min-height: ${this.canvasBackground.height};\n      max-height: ${this.canvasBackground.height};\n      object-fit: cover;\n      border-radius: 7px;\n    `,this.modalConfirmation.append(e),this.modalWrapper.style.display="flex"}closePreviewModal(){const e=document.getElementById("modalWrapper");e&&e.remove()}cancelPicture(){this.resetLiveness()}setLoading(){this.videoWrapper.insertAdjacentHTML("beforeend",'<div id="spinner">\n        <div class="lds-ripple">\n          <div style="color: white"></div>\n          <div style="color: white"></div>\n        </div>\n        <style>\n        #spinner {\n          z-index: 40;\n          width: 100%;\n          height: 100%;\n          display: flex;\n          position: absolute;\n          align-items: center;\n          justify-content: center;\n          background: rgba(20, 20, 20, 1);\n          top: 0;\n        }\n        .lds-ripple {\n          width: 80px;\n          height: 80px;\n          position: relative;\n        }\n        .lds-ripple div {\n          position: absolute;\n          border: 4px solid #000;\n          opacity: 1;\n          border-radius: 50%;\n          border-color: white;\n          animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;\n        }\n        .lds-ripple div:nth-child(2) {\n          animation-delay: -0.5s;\n        }\n        @keyframes lds-ripple {\n          0% {\n            top: 36px;\n            left: 36px;\n            width: 0;\n            height: 0;\n            opacity: 1;\n            color: white;\n          }\n          100% {\n            top: 0px;\n            left: 0px;\n            width: 72px;\n            height: 72px;\n            opacity: 0;\n          }\n        }\n        </style>\n      </div>')}removeLoading(){const e=document.getElementById("spinner");e&&e.remove()}confirmPicture(){const e=this.base64,t={method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.token}`},body:JSON.stringify({base64:{key:e.replace("data:image/png;base64,","")}})};this.setLoading();const i=`${this.livenessUrlBase}${this.livenessConfirmEndpoint}`;fetch(i,t).then((e=>e.json())).then((e=>{e?.data?this.successCallback({...e,base64:this.base64}):401!==e?.error?.statusCode?(this.errorCallback({error:e?.error,base64:this.base64}),console.error("error:",e?.error?.message)):alert("Token inválido")})).catch((e=>{e.base64=this.base64,this.errorCallback(e)})).finally((()=>{this.resetLiveness(),this.removeLoading()}))}}}},t={},i=function i(s){var n=t[s];if(void 0!==n)return n.exports;var o=t[s]={exports:{}};return e[s](o,o.exports,i),o.exports}(417);Liveness=i})();
//# sourceMappingURL=liveness.js.map