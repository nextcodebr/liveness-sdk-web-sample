"use strict";
class Liveness {
  constructor (videoWrapper, config) {
    config.height = Math.floor(config.width * 0.7778)

    this.config = config
    this.token = config.token
    this.videoWrapper = videoWrapper
    this.faceapiPath = config.faceapiPath
    this.isShowPreview = config.isShowPreview
    this.errorCallback = config.errorCallback
    this.successCallback = config.successCallback
    this.livenessUrlBase = config.livenessUrlBase
    this.displaySize = { width: config.width, height: config.height }
    this.livenessConfirmEndpoint = config.livenessConfirmEndpoint || '/liveness'
  }
  async start () {
    await this.loadFaceApi()
    await this.loadFaceApiModels()
    this.setLiveness()
  }

  setLiveness () {
    this.setLoading()
    this.createModalConfirmationWrapper()
    .createModalConfirmation()
    .createVideoElement()
    .startVideo()
  }
  resetLiveness () {
    this.removeCanvas()
    this.resetVideoWrapper()
    this.closePreviewModal()
    this.base64 = ''
    this.removeLoading()
    this.setLiveness()
  }

  async loadFaceApi () {
    const script = document.createElement('script')
    script.src = `${this.faceapiPath}/face-api.min.js`
    document.head.append(script)
    return this
  }
  async loadFaceApiModels () {
    setTimeout(async () => {
      this.faceapi = faceapi
      await this.faceapi.nets.tinyFaceDetector.loadFromUri(`${this.faceapiPath}/`)
      await this.faceapi.nets.faceLandmark68Net.loadFromUri(`${this.faceapiPath}/`)
      await this.faceapi.nets.faceRecognitionNet.loadFromUri(`${this.faceapiPath}/`)
      await this.faceapi.nets.faceExpressionNet.loadFromUri(`${this.faceapiPath}/`)
    }, 100)
    return this
  }

  startVideo () {
    const timer = setTimeout(() => {
      navigator.mediaDevices
        .getUserMedia({
          video: {}
        }).then((stream) => {
          this.video.srcObject = stream
        }).catch(err => console.error(err))
    }, 100)
    return this
  }
  createVideoElement () {
    this.video = document.createElement('video')
    this.video.style.width = this.config.width
    this.video.style.height = this.config.height
    this.video.style.transform = 'scaleX(-1)'
    this.video.setAttribute('muted', true)
    this.video.setAttribute('autoplay', true)
    this.videoWrapper.style.position = 'relative'
    this.videoWrapper.style.width = this.config.width
    this.videoWrapper.style.height = this.config.height
    this.videoWrapper.append(this.video)
    this.setVideoMask()
    this.video.addEventListener('play', () => {
      this.createMessageBox()
      this.loop()
    })
    return this
  }
  resetVideoWrapper () {
    const videoWrapper = document.getElementById('video-wrapper')
    if(videoWrapper) videoWrapper.innerHTML = ''
  }

  removeCanvas () {
    const canvas = document.getElementsByTagName('canvas')[0]
    if(canvas) canvas.remove()
  }

  setVideoMask () {
    this.videoWrapper.insertAdjacentHTML('beforeend', this.createMask())
    this.maskEllipse = document.getElementById('mask-ellipse')
    this.svgMask = document.getElementById('svg-mask')
    this.svgMask.style.width = this.config.width
    this.svgMask.style.height = this.config.height
  }
  createMask () {
    return `<svg
    id="svg-mask"
    style="display: none;"
    viewBox="0 0 720 560"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      id="mask-ellipse"
      d="M457.5 250C457.5 288.479 446.435 323.21 428.671 348.256C410.904 373.308 386.589 388.5 360 388.5C333.411 388.5 309.096 373.308 291.329 348.256C273.565 323.21 262.5 288.479 262.5 250C262.5 211.521 273.565 176.79 291.329 151.744C309.096 126.692 333.411 111.5 360 111.5C386.589 111.5 410.904 126.692 428.671 151.744C446.435 176.79 457.5 211.521 457.5 250Z"
      stroke="#B40000"
      stroke-width="5"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M30 10C18.9543 10 10 18.9543 10 30V533C10 544.046 18.9543 553 30 553H690C701.046 553 710 544.046 710 533V30C710 18.9543 701.046 10 690 10H30ZM360 391C415.228 391 460 327.872 460 250C460 172.128 415.228 109 360 109C304.772 109 260 172.128 260 250C260 327.872 304.772 391 360 391Z"
      fill="#000"
      fill-opacity="0.6"
    />
    <rect
      x="12.5"
      y="12.5"
      width="695"
      height="535"
      stroke="white"
      stroke-width="25"
    />
  </svg>`
  }
  loop () {
    const canvas = this.faceapi.createCanvasFromMedia(this.video)

    canvas.style.position = 'absolute'
    canvas.style.top = 8

    document.body.append(canvas)
    this.faceapi.matchDimensions(canvas, this.displaySize)
    this.svgMask.setAttribute('style', 'display: block; position:absolute; top: 0; left: 0;')
    this.maskEllipse.setAttribute('style', 'display: block;')
    
    const frameBox = {
      width: Math.floor(this.config.width / 3.6),
      height: Math.floor(this.config.height / 2)
    }
    frameBox.left = Math.floor((canvas.width / 2) - (frameBox.width / 2))
    frameBox.top = Math.floor((canvas.height / 2) - (frameBox.height / 1.65))
    const eyesOutter = {
      width: Math.floor((frameBox.width * 0.8)),
      height: Math.floor((frameBox.height / 5))
    }
    eyesOutter.left = Math.floor((frameBox.left + (frameBox.width / 2) - (eyesOutter.width / 2)))
    eyesOutter.top = Math.floor(frameBox.top + (frameBox.height * 0.4))
    const eyesInner = {
      width: Math.floor((frameBox.width * 0.6)),
      height: Math.floor((frameBox.height / 5))
    }
    eyesInner.left = Math.floor((frameBox.left + (frameBox.width / 2) - (eyesInner.width / 2)))
    eyesInner.top = Math.floor(frameBox.top + (frameBox.height * 0.4))

    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)

    // DEBUG
    if (this.config.isDebug) {
      this.draw(ctx, canvas, frameBox, eyesInner, eyesOutter)
    }

    const canvasPosition = canvas.getBoundingClientRect()
    const state = {
      counter: 0,
      inProgress: false,
      done: false
    }

    const timer = setInterval(async () => {
      if (state.inProgress || state.done) {
        return
      }
      state.inProgress = true

      const detections = await this.faceapi.detectSingleFace(this.video, new this.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()

      this.removeLoading()

      if (!detections) {
        this.blockMask('Face não encontrada', canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
        state.counter = 0
        state.inProgress = false
        return
      }

      const resizedDetections = this.faceapi.resizeResults(detections, this.displaySize)

      if (resizedDetections && resizedDetections.expressions) {  
        const expression = this.getExpression(resizedDetections.expressions)
        if (expression !== 'neutral') {
          if (this.config.isDebug) {
            this.blockMask(`Mantenha expressão neutra >> ${expression}`, canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          } else {
            this.blockMask('Mantenha expressão neutra', canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          }
          state.counter = 0
          state.inProgress = false
          return
        }
      }
      
      if (resizedDetections.detection) {

        // POSE
        const pose = this.getPose(resizedDetections)
        if (pose !== 'front') {
          if (this.config.isDebug) {
            this.blockMask(`Centralize seu rosto >> ${pose}`, canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          } else {
            this.blockMask('Centralize seu rosto', canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          }
          state.counter = 0
          state.inProgress = false
          return
        }

        // ANGLE
        const jaw = resizedDetections.landmarks.getJawOutline()
        const rotated = this.isRotatedFace(jaw[0], jaw[16])
        if (rotated) {
          if (this.config.isDebug) {
            this.blockMask('Centralize seu rosto >> rotacionado', canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          } else {
            this.blockMask('Centralize seu rosto', canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          }
          state.counter = 0
          state.inProgress = false
          return
        }

        // DEBUG
        if (this.config.isDebug) {
          this.draw(ctx, canvas, frameBox, eyesInner, eyesOutter)
          ctx.beginPath()
          ctx.lineWidth = '5'
          ctx.strokeStyle = 'green'
          ctx.moveTo(jaw[0].x, jaw[0].y)
          ctx.lineTo(jaw[16].x, jaw[16].y)
          ctx.stroke()
        }


        const leftEye = {
          meanPosition: [jaw[0].x, jaw[0].y],
          frameBox: { isInside: false },
          outterBox: { isInside: false },
          innerBox: { isInside: false }
        }
        const rightEye = { 
          meanPosition: [jaw[16].x, jaw[16].y],
          frameBox: { isInside: false },
          outterBox: { isInside: false },
          innerBox: { isInside: false }
        }

        leftEye.frameBox.isInside = this.isInside(leftEye.meanPosition, { top: frameBox.top, left: frameBox.left, width: frameBox.width, height: frameBox.height })
        rightEye.frameBox.isInside = this.isInside(rightEye.meanPosition, { top: frameBox.top, left: frameBox.left, width: frameBox.width, height: frameBox.height })

        leftEye.outterBox.isInside = this.isInside(leftEye.meanPosition, { top: eyesOutter.top, left: eyesOutter.left, width: eyesOutter.width, height: eyesOutter.height })
        rightEye.outterBox.isInside = this.isInside(rightEye.meanPosition, { top: eyesOutter.top, left: eyesOutter.left, width: eyesOutter.width, height: eyesOutter.height })

        leftEye.innerBox.isInside = this.isInside(leftEye.meanPosition, { top: eyesInner.top, left: eyesInner.left, width: eyesInner.width, height: eyesInner.height })
        rightEye.innerBox.isInside = this.isInside(rightEye.meanPosition, { top: eyesInner.top, left: eyesInner.left, width: eyesInner.width, height: eyesInner.height })
        
        if (!leftEye.frameBox.isInside || !rightEye.frameBox.isInside) {
          this.blockMask('Posicione seu rosto dentro da moldura', canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }

        if (!leftEye.outterBox.isInside || !rightEye.outterBox.isInside) {
          this.blockMask('Afaste seu rosto', canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }

        if (leftEye.innerBox.isInside || rightEye.innerBox.isInside) {
          this.blockMask('Aproxime seu rosto', canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }

        this.msg.style = 'display: none;'
        this.activateEllipseMask()
        state.counter += 1
        state.inProgress = false
        if (state.counter >= 2) {
          state.done = true
          this.takePicture(canvas)
          clearInterval(timer)
        }
      }
      
    }, 250)
  }
  activateEllipseMask () {
    this.maskEllipse.setAttribute('stroke', '#0F0')
  }
  deactivateEllipseMask () {
    this.maskEllipse.setAttribute('stroke', '#F00')
  }
  draw (ctx, canvas, frameBox, eyesInner, eyesOutter) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    ctx.lineWidth = '3'
    ctx.strokeStyle = 'blue'
    ctx.rect(frameBox.left, frameBox.top, frameBox.width, frameBox.height)
    ctx.stroke()
  
    ctx.beginPath()
    ctx.lineWidth = '2'
    ctx.strokeStyle = 'blue'
    ctx.rect(eyesInner.left, eyesInner.top, eyesInner.width, eyesInner.height)
    ctx.stroke()
  
    ctx.beginPath()
    ctx.lineWidth = '2'
    ctx.strokeStyle = 'red'
    ctx.rect(eyesOutter.left, eyesOutter.top, eyesOutter.width, eyesOutter.height)
    ctx.stroke()
  }
  getExpression (expressions) {
    const expArr = []
    for (const [key, value] of Object.entries(expressions)) {
      expArr.push({ expression: key, confidence: value })
    }
    const exp = expArr.sort((a, b) => a.confidence - b.confidence).pop()
    return (exp && exp.expression) ? exp.expression : null
  }
  getPose(res) {
    const eye_right = this.getMeanPosition(res.landmarks.getRightEye())
    const eye_left = this.getMeanPosition(res.landmarks.getLeftEye())
    const nose = this.getMeanPosition(res.landmarks.getNose())
    const mouth = this.getMeanPosition(res.landmarks.getMouth())
    const jaw = this.getTop(res.landmarks.getJawOutline())
    const rx = (jaw - mouth[1]) / res.detection.box.height + 0.5
    const ry = (eye_left[0] + (eye_right[0] - eye_left[0]) / 2 - nose[0]) / res.detection.box.width
    let state = 'undetected'

    if (res.detection.score > 0.3) {
      state = 'front'
      if (rx > 0.2) {
        state = 'top'
      } else if (rx < -0.1) {
        state = 'bottom'
      } else {
        if (ry < -0.04) {
          state = 'left'
        }
        if (ry > 0.04) {
          state = 'right'
        }
      }
    }
    return state
  }
  isRotatedFace (p1, p2) {
    const angleDeg = Math.abs(Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI)
    return angleDeg > 7
  }
  getMeanPosition (l) {
    return l
      .map((a) => [a.x, a.y])
      .reduce((a, b) => [a[0] + b[0], a[1] + b[1]])
      .map((a) => a / l.length)
  }
  getTop (l) {
    return l
      .map((a) => a.y)
      .reduce((a, b) => Math.min(a, b));
  }
  isInside (a = [], b = {}) {
    if (a[1] < b.top) {
      return false
    }
    if (a[0] < b.left) {
      return false
    }
    if (a[1] > b.top + b.height) {
      return false
    }
    if (a[0] > b.left + b.width) {
      return false
    }
    return true
  }
  blockMask (message, canvasPosition, left, top, height, width) {
    const dimensions = {
      width: 230,
      height: 35
    }
    dimensions.top = top + height + 20
    dimensions.left = (left + (width / 2)) - (dimensions.width / 2)

    this.maskEllipse.setAttribute('stroke', '#B40000')
    this.msg.textContent = message
    this.msg.style = `
      padding: 10px;
      color: #ba3939;
      position: absolute;
      text-align: center;
      background: #ffe0e0;
      top: ${dimensions.top}px;
      left: ${dimensions.left}px;
      width: ${dimensions.width}px; 
      height: ${dimensions.height}px;
      border: 1px solid #a33a3a;
      font-family: 'Prompt', sans-serif;
    `
  }
  takePicture (canvas) {
    const context = canvas.getContext('2d')
    canvas.style = 'display: none;' 
    context.drawImage(this.video, 0, 0, canvas.width, canvas.height)
    this.base64 = canvas.toDataURL('image/png')

    if(this.isShowPreview) {
      this.openPreviewModal()
    }
    else {
      this.confirmPicture()
    }
  }
  createMessageBox () {
    this.msg = document.createElement('div')
    this.videoWrapper.append(this.msg)
    return this
  }
  createModalConfirmationWrapper () {
    this.modalWrapper = document.createElement('div')
    this.modalWrapper.style = `
    top: 0;
    left: 0;
    z-index: 10;
    width: 100%;
    height: 100%;
    display: none;
    position: fixed;
    align-items: center;
    justify-content: center;
    background: rgba(20, 20, 20, 0.95);
    `
    this.modalWrapper.id = 'modalWrapper'
    document.body.append(this.modalWrapper)
    return this
  }
  createModalConfirmation () {
    this.modalConfirmation = document.createElement('div')
    this.modalConfirmation.style = `
    padding: 7px;
    display: flex;
    max-width: 720px;
    background: white;
    max-height: 560px;
    border-radius: 7px;
    position: relative;
    align-items: center;
    justify-content: center;
    `
    const confirmButton = document.createElement('button')
    confirmButton.textContent = 'Confirmar'
    confirmButton.style = `
    color: #555;
    right: 10px;
    width: 160px;
    height: 50px;
    bottom: 10px;
    cursor: pointer;
    background: #fff;
    font-weight: 600;
    border-radius: 7px;
    margin-right: 10px;
    border: 1px solid #222;
    `
    const cancelButton = document.createElement('button')
    cancelButton.textContent = 'Cancelar'
    cancelButton.style = `
    color: #444;
    right: 10px;
    width: 160px;
    height: 50px;
    bottom: 10px;
    cursor: pointer;
    background: #fff;
    font-weight: 600;
    border-radius: 7px;
    margin-right: 10px;
    border: 1px solid #222;
    `
    const footer = document.createElement('div')
    footer.style = `
    right: 0;
    bottom: 0;
    width: 100%;
    display: flex;
    padding: 10px 0;
    position: absolute;
    justify-content: center;
    `
    footer.append(cancelButton)
    footer.append(confirmButton)
    this.modalConfirmation.append(footer)
    this.modalWrapper.append(this.modalConfirmation)
    confirmButton.addEventListener('click', () => {
      this.closePreviewModal()
      this.confirmPicture()
    })
    cancelButton.addEventListener('click', () => {
      this.cancelPicture()
    })
    return this
  }

  openPreviewModal () {
    const image = document.createElement('img')
    image.src = this.base64
    image.style = `
      max-width: 720px;
      min-width: 520px;
      min-height: 360px;
      max-height: 560px;
      object-fit: cover;
      border-radius: 7px;
    `
    this.modalConfirmation.append(image)
    this.modalWrapper.style.display = 'flex'
  }

  closePreviewModal () {
    const modal = document.getElementById('modalWrapper')
    if (modal) modal.remove()
  }

  cancelPicture () {
    this.resetLiveness()
  }

  setLoading () { 
    const spinner = `<div id="spinner">
        <div class="lds-ripple">
          <div style="color: white"></div>
          <div style="color: white"></div>
        </div>
        <style>
        #spinner {
          z-index: 40;
          align-content: center;
          width: 100%;
          height: 100%;
          display: flex;
          position: absolute;
          align-items: center;
          justify-content: center;
          background: rgba(20, 20, 20, 1);
          top: 0;
        }
        .lds-ripple {
          width: 80px;
          height: 80px;
          position: relative;
        }
        .lds-ripple div {
          position: absolute;
          border: 4px solid #000;
          opacity: 1;
          border-radius: 50%;
          border-color: white;
          animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
        }
        .lds-ripple div:nth-child(2) {
          animation-delay: -0.5s;
        }
        @keyframes lds-ripple {
          0% {
            top: 36px;
            left: 36px;
            width: 0;
            height: 0;
            opacity: 1;
            color: white;
          }
          100% {
            top: 0px;
            left: 0px;
            width: 72px;
            height: 72px;
            opacity: 0;
          }
        }
        </style>
      </div>`
    this.videoWrapper.insertAdjacentHTML('beforeend', spinner)
  }
  removeLoading () {
    const spinner = document.getElementById('spinner')
    if(spinner) spinner.remove()
  }

  confirmPicture () {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        base64: {
          key: this.base64.replace('data:image/png;base64,', '')
        }
      })
    }
    this.setLoading()
    const endpoint = `${this.livenessUrlBase}${this.livenessConfirmEndpoint}`
    fetch(endpoint, requestOptions)
      .then(response => response.json())
      .then(result => { 
        if (result && result.error && result.error.statusCode === 401) {
          alert('Token inválido')
          this.resetLiveness()
          this.errorCallback(result)
          return
        }
  
        let success = false 
  
        if (result && result.data && result.data.real && parseFloat(result.data.real) > 0.97) {
          success = true
        }
        if (result && result.isAlive) {
          success = true
        }
        
        if (success) {
          this.successCallback(result)
        } else {
          this.errorCallback(result)
        }
      })
      .catch(error => {
        console.log('error', error)
        this.errorCallback(error)
      })
      .finally(() => {
        this.resetLiveness()
        this.removeLoading()
      })
  }
}

module.exports = Liveness
