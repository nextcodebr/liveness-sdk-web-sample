"use strict";
class Liveness {

  constructor (videoWrapper, config) {
    const windowWidth = window.innerWidth
    if (config.width >= windowWidth) {
      config.width = windowWidth
    }

    config.height = Math.floor(config.width * 0.7778)
    this.config = config
    this.token = config.token
    this.videoWrapper = videoWrapper
    this.faceapi = null
    this.configFrameBox = config.frameBox

    const cssOrientationStyle = document.createElement('style')
    cssOrientationStyle.innerText = this.cssOrientationLock()
    document.head.appendChild(cssOrientationStyle)
    
    if (config.brightnessControl) this.brightnessControl = config.brightnessControl
    else this.brightnessControl = 95

    if (config.luminanceControl) this.luminanceControl = config.luminanceControl
    else this.luminanceControl = 23

    this.faceapiPath = config.faceapiPath
    this.isShowPreview = config.isShowPreview
    this.errorCallback = config.errorCallback
    this.successCallback = config.successCallback
    this.livenessUrlBase = config.livenessUrlBase
    this.displaySize = { width: config.width, height: config.height }
    this.livenessConfirmEndpoint = config.livenessConfirmEndpoint || '/liveness/v2'

    const maskStyle = document.createElement('style')
    maskStyle.innerHTML = `
      #path.active {
        stroke: #46E3C3 !important;
        stroke-width: 10 !important;
      }
      #mask-wrapper {
        top: 0;
        left: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
        position: absolute;
        transition: all 0.9s ease-in-out;
        background-color: transparent;
      }

      #mask-wrapper svg > rect{
        fill: transparent;
        mask: url(#svg-mask);
      }

      #svg-mask{
        min-height: 100%
      }

      #svg-mask rect{
        display: flex;
        fill: rgba(255, 255, 255, 0.5);
        min-width: 100%;
        min-height: 100%;
      }
      #mask-path {
        transition: all 0.7s;
        transform: translateX(23%) translateY(11%) scale(0.95) scaleX(1.1);
        stroke: white;
        stroke-width: 3;
      }
      #path {
        fill: transparent;
        transition: all 0.3s;
        transform: translateX(23%) translateY(11%) scale(0.95) scaleX(1.1);
        stroke: #D02780 !important;
        stroke-width: 3;
      }
      @media screen and (min-width: 280px){
        #mask-path {
        }
      }
      @media screen and (min-width: 320px){
        #path {
          transform: translateX(28%) translateY(14%) scaleX(0.7) scaleY(0.67);
        }
      }
      @media screen and (min-width: 360px){
        #path {
          transform: translateX(28.3%) translateY(8%) scaleX(0.8) scaleY(0.85);
        }
      }
      @media screen and (min-width: 375px){
        #path {
          transform: translateX(27%) translateY(4%) scaleX(0.9) scaleY(0.9)
        }
      }
      @media screen and (min-width: 390px){
        #path {
          transform: translateX(25.5%) translateY(8%) scaleX(1) scaleY(0.9);
        }
      }
      @media screen and (min-width: 393px){
        #mask-path {
        }
      }
      @media screen and (min-width: 412px){
        #path {
          transform: translateX(26.8%) translateY(6%) scaleX(1) scaleY(0.95)
        }
      }
      @media screen and (min-width: 414px){
        #path {
          transform: translateX(27.2%) translateY(9%) scaleX(1) scaleY(0.95);
        }
      }
      @media screen and (min-width: 768px){
        #path, #mask-path {
          transform: translateX(24%) translateY(3%) scale(2) scaleX(1);
        }
      }
    `
    document.body.insertAdjacentElement('afterbegin', maskStyle)
  }

  setMinBrightness (value) {
    this.brightnessControl = value
  }

  setMinLuminance (value) {
    this.luminanceControl = value
  }

  setFrameBoxesWidth (eyesInner, eyesOutter, box) {
    this.configFrameBox = {
      eyesInner,
      eyesOutter,
      box
    }
  }

  async start () {
    if (!window.faceapi) {
      await this.loadFaceApi()
    } else {
      this.faceapi = window.faceapi
      this.setLiveness()
    }
  }

  setLiveness () {
    this.setLoading()
    this.createModalConfirmationWrapper()
    .createModalConfirmation()
    .createVideoElement()
    .startVideo()
    .createCanvasBackground()
  }
  resetLiveness () {
    this.removeCanvas()
    this.resetVideoWrapper()
    this.closePreviewModal()
    this.base64 = ''
    this.removeLoading()
    this.setLiveness()
  }

  cssOrientationLock () {
    return '@media screen and (min-width: 320px) and (max-width: 767px) and (orientation: landscape) { html { transform: rotate(-90deg);transform-origin: left top;width: 100vh;overflow-x: hidden;position: absolute;top: 100%;left: 0;}}'
  }

  createCanvasBackground () {
    this.canvasBackground = document.createElement('canvas')
    this.canvasBackground.width = 580
    this.canvasBackground.height = 530
    this.canvasBackground.style.display = 'none'
  }

  sweepVideo (data) {
    this.luminanceAvg = 0
    this.brightnessSum = 0 
    this.luminanceArray = []

    for (let x = 0; x < data.length; x += 4) {
      const r = data[x]
      const g = data[x + 1]
      const b = data[x + 2]
      this.sweepBrightness(r, g, b)
      this.sweepLuminance(r, g, b)
    }
    this.checkBrightness()
  }

  checkBrightness () {
    this.brightness = Math.floor(this.brightnessSum / (this.canvasBackground.width * this.canvasBackground.height))
  }

  sweepBrightness (r, g, b) {
    this.brightnessSum += Math.floor((r + g + b) / 3)
  }

  sweepLuminance (r, g, b) {
    this.luminanceAvg += this.calcLuminance(r, g, b)
    this.luminanceArray.push(this.calcLuminance(r, g, b))     

    this.luminance = (this.luminanceAvg / this.luminanceArray?.length) * 100
  }

  calcLuminance (r, g, b) {
    let colorArray = [r, g, b]
    let colorFactor
    for (let i = 0; i < colorArray.length; i++) {
        colorFactor = colorArray[i] / 255
        if (colorFactor <= 0.03928) {
            colorFactor = colorFactor / 12.92
        } else {
            colorFactor = Math.pow(((colorFactor + 0.055) / 1.055), 2.4)
        }
        colorArray[i] = colorFactor
    }
    return (colorArray[0] * 0.2126 + colorArray[1] * 0.7152 + colorArray[2] * 0.0722) + 0.05
  }


  async loadFaceApi () {
    const script = document.createElement('script')
    const faceJS = `${this.faceapiPath}/face-api.min.js`
    script.src = faceJS
    document.head.append(script)
    script.onload = async () => {
      await this.loadFaceApiModels()
    }
    return this
  }
  async loadFaceApiModels () {
    setTimeout(async () => {
      Promise.all([
        window.faceapi.nets.tinyFaceDetector.loadFromUri(this.faceapiPath),
        window.faceapi.nets.faceLandmark68Net.loadFromUri(this.faceapiPath),
        window.faceapi.nets.faceRecognitionNet.loadFromUri(this.faceapiPath),
        window.faceapi.nets.faceExpressionNet.loadFromUri(this.faceapiPath)
      ]).then(() => {
        console.log('Models were loaded')
        this.faceapi = faceapi
        this.setLiveness()
      }).catch(e => e)
    }, 100)
    return this
  }

  startVideo () {
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {}
    }
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia não implementado nesse browser'))
        }
        return new Promise(function(resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject)
        })
      }
    }
    navigator.mediaDevices.getUserMedia({
        video: {          
          width: this.config.width,
          height: this.config.height
        }
      }).then((stream) => {
        const video = document.querySelector('video')
        if ("srcObject" in video) {
          video.srcObject = stream
        } else {
          video.src = window.URL.createObjectURL(stream)
        }
      }).catch(err => console.error(err))
    return this
  }
  createVideoElement () {
    this.video = document.createElement('video')
    this.video.style.width = '100%'
    this.video.style.height = '100%'
    this.video.style.transform = 'scaleX(-1)'
    this.video.setAttribute('muted', true)
    this.video.setAttribute('autoplay', true)
    this.video.setAttribute('playsinline', '')
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
    this.maskEllipse = document.getElementById('path')
    this.svgMask = document.getElementById('mask-wrapper')
    this.svgMask.style.width = this.config.width
    this.svgMask.style.height = this.config.height
  }
  createMask () {
    return `
    <div
      id="mask-wrapper"
    >
      <svg id="svg-tag" height="100%" width="100%" >
       <!-- <defs>
          <mask id="svg-mask" x="0" y="0" height="100%" width="100%">
            <rect x="0" y="0" height="100%" width="100%" />
            <path id="mask-path" d="M90.3388 2.19951L90.4192 2.20821H90.5C111.984 2.20821 130.012 9.83016 142.234 28.4016C154.52 47.0702 161.077 77.0066 158.989 121.926C153.095 155.359 145.385 185.102 133.16 207.538C121.011 229.838 104.476 244.8 80.886 249.101C56.3373 241.868 39.9103 227.275 28.2091 206.302C16.4187 185.169 9.42403 157.551 3.8751 124.41C-1.14749 81.0439 6.83706 49.0057 22.7846 28.5956C38.6991 8.22774 62.7183 -0.786687 90.3388 2.19951Z" fill="black" stroke="#D02780" stroke-width="3"/>
          </mask>
        </defs> -->
        <path id="path" d="M90.3388 2.19951L90.4192 2.20821H90.5C111.984 2.20821 130.012 9.83016 142.234 28.4016C154.52 47.0702 161.077 77.0066 158.989 121.926C153.095 155.359 145.385 185.102 133.16 207.538C121.011 229.838 104.476 244.8 80.886 249.101C56.3373 241.868 39.9103 227.275 28.2091 206.302C16.4187 185.169 9.42403 157.551 3.8751 124.41C-1.14749 81.0439 6.83706 49.0057 22.7846 28.5956C38.6991 8.22774 62.7183 -0.786687 90.3388 2.19951Z" fill="black" stroke="#D02780" stroke-width="3"/>
        <rect x="0" y="0" height="100%" width="100%" />
      </svg>
    </div>
    `
  }
  responsiveFrameBoxEyesOutterWidth (windowWidth) {
    switch (windowWidth) {
      case 818:
        return {
          eyesInner: 0.74,
          eyesOutter: 0.78,
          box: 0.60
        }
        break;
      case 414:
        return {
          eyesInner: 0.68,
          eyesOutter: 0.72,
          box: 0.55
        }
        break;
      case 412:
        return {
          eyesInner: 0.68,
          eyesOutter: 0.69,
          box: 0.55
        }
        break;
      case 375:
        return {
          eyesInner: 0.67,
          eyesOutter: 0.69,
          box: 0.55
        }
        break;
      case 360:
        return {
          eyesInner: 0.63,
          eyesOutter: 0.67,
          box: 0.55
        }
        break;
      case 320:
        return {
          eyesInner: 0.62,
          eyesOutter: 0.67,
          box: 0.55
        }
        break;
      case 315:
        return {
          eyesInner: 0.74,
          eyesOutter: 0.78,
          box: 0.53
        }
        break;
    
      default:
        return {
          eyesInner: 0.74,
          eyesOutter: 0.8,
          box: 0.515
        }
        break;
    }
  }
  loop () {
    if (this.video.style.width.includes('%')) {
      this.displaySize.width = this.video.style.width = this.video.clientWidth
      this.displaySize.height = this.video.style.height = this.video.clientHeight
    }
    this.canvas = this.faceapi.createCanvasFromMedia(this.video)

    this.canvas.style.position = 'absolute'
    this.canvas.style.left = 0
    this.canvas.style.top = 10

    this.canvas.style.width = this.videoWrapper.style.width
    this.canvas.height = this.videoWrapper.clientHeight
    this.canvas.style.height = this.videoWrapper.clientHeight
    this.canvas.style.minHeight = this.videoWrapper.clientHeight

    this.svgTag = document.getElementById('svg-tag')

    this.videoWrapper.append(this.canvas)

    this.faceapi.matchDimensions(this.canvas, this.displaySize)
    this.svgMask.setAttribute('style', 'display: block; position:absolute; top: 0; left: 0;')
    this.maskEllipse.setAttribute('style', 'display: block;')

    this.boxesWidth = this.responsiveFrameBoxEyesOutterWidth(window.innerWidth)
    if (this.configFrameBox) this.boxesWidth = this.configFrameBox


    const frameBox = {
      width: Math.floor(this.config.width * this.boxesWidth.box),
      height: Math.floor(this.config.height * .922)
    }
    frameBox.left = Math.floor((this.canvas.width / 2) - (frameBox.width / 2))
    frameBox.top = Math.floor( (this.videoWrapper.clientHeight / 2) - (frameBox.height / 2)  )
    this.svgTag.style.marginTop = frameBox.top
    const eyesOutter = {
      width: Math.floor((frameBox.width * this.boxesWidth.eyesOutter)),
      height: Math.floor((frameBox.height / 5))
    }
    eyesOutter.left = Math.floor((frameBox.left + (frameBox.width / 1.95) - (eyesOutter.width / 1.95)))
    eyesOutter.top = Math.floor(frameBox.top + (frameBox.height * 0.3))
    const eyesInner = {
      width: Math.floor((frameBox.width * this.boxesWidth.eyesInner)),
      height: Math.floor((frameBox.height / 5))
    }
    eyesInner.left = Math.floor((frameBox.left + (frameBox.width / 1.96) - (eyesInner.width / 1.96)))
    eyesInner.top = Math.floor(frameBox.top + (frameBox.height * 0.3))

    const ctx = this.canvas.getContext('2d')
    ctx.translate(this.canvas.width, 0)
    ctx.scale(-1, 1)

    // DEBUG
    if (this.config.isDebug) {
      this.draw(ctx, this.canvas, frameBox, eyesInner, eyesOutter)
    }

    const canvasPosition = this.canvas.getBoundingClientRect()
    const state = {
      counter: 0,
      inProgress: false,
      done: false
    }

    const timerBackground = setInterval(() => {
      this.checkBackground()
    }, 1000);

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
          this.draw(ctx, this.canvas, frameBox, eyesInner, eyesOutter)
          ctx.beginPath()
          ctx.lineWidth = '5'
          ctx.strokeStyle = '#FFFF00'
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


        if (!this.isBackgroundOK) {
          this.blockMask('O ambiente está escuro', canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }

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

        this.activateEllipseMask()
    
        state.counter += 1
        state.inProgress = false
        if (state.counter >= 2) {
          state.done = true
          this.takePicture(this.canvas)
          clearInterval(timer)
          clearInterval(timerBackground)
        }
      }
      
    }, 150)
  }
  activateEllipseMask () {
    this.maskEllipse.classList.add('active')
  }
  deactivateEllipseMask () {
    this.maskEllipse.classList.remove('active')
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
    ctx.strokeStyle = 'yellow'
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
    const rx = (jaw - mouth[1]) / res.detection.box.height + 0.45
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
      .reduce((a, b) => Math.min(a, b))
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
    const MASK_WHITE_BORDER = 50
    const dimensions = {
      width: 230,
      height: 35
    }
    dimensions.top = top + height + 20
    dimensions.left = (left + (width / 2)) - (dimensions.width / 2)


    this.maskEllipse.classList.remove('active')
    this.msg.innerHTML = ''
    const elMessage = document.createElement('span')
    elMessage.textContent = message
    elMessage.style = 
    `
      display: flex;
      color: #f3f3f5;
      z-index: 20;
      font-size: 1.1rem;
      padding: 10px 20px;
      text-align: center;
      align-items: center;
      background: #D02780;
      border-radius: 7px;
      justify-content: center;
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      font-family: Prompt, sans-serif;
    `
    this.msg.style.display = 'flex'
    this.msg.appendChild(elMessage)
  }
  takePicture (canvas) {
    const context = this.canvasBackground.getContext('2d')
    this.canvasBackground.style.display = 'none;'
    this.createFlashMask()
    context.drawImage(this.video, 0, 0, this.canvasBackground.width, this.canvasBackground.height)
    this.base64 = this.canvasBackground.toDataURL('image/png')

    setTimeout(() => {
      this.removeFlashMask()

      if(this.isShowPreview) {
        this.openPreviewModal()
      }
      else {
        this.confirmPicture()
      }
      
    }, 300)
  }
  checkBackground () {
    if (!this.canvasBackground) return
    const context = this.canvasBackground.getContext('2d')

    context.drawImage(this.video, 0, 0, this.canvasBackground.width, this.canvasBackground.height)
    const pictureData = context.getImageData(0,0,this.canvasBackground.width,this.canvasBackground.height)
    this.sweepVideo(pictureData.data)

    this.isBackgroundOK = (this.brightness >= this.brightnessControl && this.luminance >= this.luminanceControl)

    if (this.config.isDebug) {
      const table = {
        brilho: {
          atual: this.brightness,
          'mín aceitável': this.brightnessControl,
        },
        'luminânia': {
          atual: parseFloat(this.luminance.toFixed(2)),
          'mín aceitável': this.luminanceControl
        }
      }
      console.table(table)
    }
  }
  createFlashMask () {
    const flash = document.createElement('div')
    flash.style.width = '100%'
    flash.style.height = '100vh'
    flash.style.position = 'fixed'
    flash.style.background = 'white'
    flash.style.zIndex = 30
    flash.style.top = 0
    flash.style.left = 0
    flash.id = 'flash'
    document.body.append(flash)
  }
  removeFlashMask () {
    const flash = document.getElementById('flash')
    flash.remove()
  }
  createMessageBox () {
    this.msg = document.createElement('div')
    this.msg.style = `
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      background: transparent;
      position: absolute;
      bottom: 0;
    `
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
    const base64Local = this.base64
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        base64: {
          key: base64Local.replace('data:image/png;base64,', '')
        }
      })
    }
    this.setLoading()
    const endpoint = `${this.livenessUrlBase}${this.livenessConfirmEndpoint}`
    fetch(endpoint, requestOptions)
      .then(response => response.json())
      .then(result => {
        if (result?.data) {
          this.successCallback({...result, base64: this.base64})
          return
        }

        if (result?.error?.statusCode === 401) {
          alert('Token inválido')
          return
        }

        this.errorCallback({ error: result?.error, base64: this.base64})
        console.error('error:', result?.error?.message)

      })
      .catch(error => {
        error.base64 = this.base64
        this.errorCallback(error)
      })
      .finally(() => {
        this.resetLiveness()
        this.removeLoading()
      })
  }
}

module.exports = Liveness
