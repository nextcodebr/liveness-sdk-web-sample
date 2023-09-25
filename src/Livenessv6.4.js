"use strict";
class Liveness {

  constructor (videoWrapper, config) {
    this.uploadInProgress = 0.00
    this.requestType = 'b64'
    this.counterNotFoundFace = 0
    this.faceapi = null
    this.token = config.token
    this.videoWrapper = videoWrapper
    this.configFrameBox = config.frameBox

    if (config.scalingFactorForLiveness &&
      config.scalingFactorForLiveness !== 0 &&
        config.scalingFactorForLiveness <= 3) {
      this.scalingFactorForLiveness = config.scalingFactorForLiveness
    } else this.scalingFactorForLiveness = 1

    this.config = {
      width: config.width || this.getFullWidth(),
      height: config.height || this.getFullHeight()
    }

    this.config.heightAspectRatio = this.isMobile()
     ? this.config.width * (4 / 3)
     : this.config.width / (4 / 3)
    this.config.isDebug = config.isDebug

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
    this.livenessConfirmEndpoint = config.livenessConfirmEndpoint || '/liveness/v2'
    this.ellipseStrokeStyleDefault = config.ellipseStrokeStyle || '#D02780'
    this.activatedEllipseStrokeStyle = config.activatedEllipseStrokeStyle || '#46E3C3'
    this.boxMessageBackgroundColor = config.boxMessageBackgroundColor || '#D02780'
    this.boxMessageTextColor = config.boxMessageTextColor || '#f3f3f5'
    this.configEyesBoxHeight = config.configEyesBoxHeight || 20
    this.requestAnimationFrame = window.requestAnimationFrame
    this.shouldCheckNeutralFace = config.shouldCheckNeutralFace || false
    this.facetimeInterval = config.facetimeInterval || 150
    this.timeToDetectFace = config.timeToDetectFace || 6000
    this.showNotFoundModal = config.showNotFoundModal || false
    this.cameraPermissionErrorCallback = config.cameraPermissionErrorCallback || null
  }
  getFullWidth () {
    return Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    )
  }
  getFullHeight () {
    return Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    );
  }
  setUseBase64 () {
    this.requestType = "b64"
  }

  setUseFormData () {
    this.requestType = "formData"
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
  setDimensionsRequestImage (width, height) {
    this.config.dimensions = {
      width,
      height
    }
  }
  toggleDebug () {
    this.config.isDebug = !this.config.isDebug
    if (!this.config.isDebug) {
      const ctx = this.canvas.getContext('2d')
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }

  setEyesBoxHeight (pixels) {
    this.configEyesBoxHeight = pixels
  }

  stop () {
    this.video.pause()
    const tracks = this.stream.getTracks()
    tracks.forEach(track => track.stop())
    clearInterval(this.timer)
    clearInterval(this.timerBackground)
  }

  setCheckNeutralFace (value) {
    this.shouldCheckNeutralFace = value
  }

  async start (callback) {
    this.startCallbackFunction = callback
    if (!window.faceapi) {
      await this.loadFaceApi()
    } else {
      this.faceapi = window.faceapi
      this.setLiveness()
    }
  }

  setLiveness () {
    this.setLoading()
    this.createVideoElement()
    .startVideo()
    .createModalConfirmationWrapper()
    .createModalConfirmation()
  }

  destroyLiveness () {
    this.stop()
    this.removeCanvas()
    this.resetVideoWrapper()
  }

  resetLiveness () {
    this.stop()
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
    const width = this.videoWrapper.clientWidth * this.getDevicePixelRatio()
    const height = this.videoWrapper.clientHeight * this.getDevicePixelRatio()
    // if (window.innerWidth < 720) {
    //   this.canvasBackground.width = width * 2
    //   this.canvasBackground.height = height * 2
    // } else {
    //   this.canvasBackground.width = width
    //   this.canvasBackground.height = height
    // }

    this.canvasBackground.width = this.isMobile()
      ? this.video.clientWidth * (window.devicePixelRatio || 2)
      : this.config.width
    this.canvasBackground.height = this.isMobile()
      ? this.config.heightAspectRatio * (window.devicePixelRatio || 2)
      : this.config.height
    
    if (this.scalingFactorForLiveness) {
      this.canvasBackground.width = this.canvasBackground.width * this.scalingFactorForLiveness
      this.canvasBackground.height = this.canvasBackground.height * this.scalingFactorForLiveness
    }
    
    if (this.config.dimensions) {
      this.canvasBackground.width = this.config.dimensions.width
      this.canvasBackground.height = this.config.dimensions.height
    }
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

  isMobile () {
    const acceptedBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    return acceptedBrowser.test(navigator.userAgent)
  }

  checkBrightness () {
    this.brightness = Math.floor(this.brightnessSum / (this.canvasLuminance.width * this.canvasLuminance.height))
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
  getDevicePixelRatio () {
    let mediaQuery
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    if (window.devicePixelRatio !== undefined && !isFirefox) {
      return window.devicePixelRatio
    } else if (window.matchMedia) {
      mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
        (min--moz-device-pixel-ratio: 1.5),\
        (-o-min-device-pixel-ratio: 3/2),\
        (min-resolution: 1.5dppx)"
      if (window.matchMedia(mediaQuery).matches) {
        return 1.5
      }
      mediaQuery = "(-webkit-min-device-pixel-ratio: 2),\
        (min--moz-device-pixel-ratio: 2),\
        (-o-min-device-pixel-ratio: 2/1),\
        (min-resolution: 2dppx)"
      if (window.matchMedia(mediaQuery).matches) {
        return 2
      }
      mediaQuery = "(-webkit-min-device-pixel-ratio: 0.75),\
        (min--moz-device-pixel-ratio: 0.75),\
        (-o-min-device-pixel-ratio: 3/4),\
        (min-resolution: 0.75dppx)"
      if (window.matchMedia(mediaQuery).matches) {
        return 1.5
      }
    } else {
      return 1
    }
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
        window.faceapi.nets.faceLandmark68Net.loadFromUri(this.faceapiPath),
        window.faceapi.nets.faceExpressionNet.loadFromUri(this.faceapiPath),
        window.faceapi.nets.faceRecognitionNet.loadFromUri(this.faceapiPath)
      ])
      .then(async () => {
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(this.faceapiPath)
        console.log('Models were loaded')
        this.faceapi = faceapi
        this.setLiveness()
      })
      .catch(e => console.error('error', e))
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

    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
      const constraints = {
        video: {  
          width: this.config.width,
          height: this.config.height,
          frameRate: 24
        }
      }
      if (this.isMobile()) constraints.video = { facingMode: 'user' }
      else {
        const backCamera = devices.filter(device => device.kind === 'videoinput' && !device.label.includes('m-de:vice'))[0]
        if (backCamera) constraints.video.deviceId = backCamera.deviceId
      }

      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          const video = document.querySelector('video')

          if (!video) return

          this.stream = stream
          navigator.streamLiveness = stream
          if ("srcObject" in video) {
            video.srcObject = stream
          } else {
            video.src = window.URL.createObjectURL(stream)
          }
          !!this.startCallbackFunction && this.startCallbackFunction()
        }).catch(err => {
          if (this.cameraPermissionErrorCallback) this.cameraPermissionErrorCallback(err)
          else throw new Error(err)
        })
    })
    return this
  }
  createVideoElement () {
    this.videoWrapper.style.position = 'relative'
    this.videoWrapper.style.width = this.config.width
    this.videoWrapper.style.height = this.config.height

    this.video = document.createElement('video')
    this.video.style.width = 'inherit'
    this.video.style.height = 'inherit'
    this.video.style.transform = 'scaleX(-1)'
    this.video.setAttribute('muted', true)
    this.video.setAttribute('autoplay', true)
    this.video.setAttribute('playsinline', '')
    this.videoWrapper.append(this.video)
    this.video.addEventListener('play', () => {
      this.loop()
      this.createCanvasBackground()
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

  responsiveFrameBoxEyesOutterWidth (windowWidth) {
    switch (windowWidth) {
      case 315:
        return {
          eyesInner: 0.74,
          eyesOutter: 0.78,
          box: 0.55
        }
        break;
    
      default:
        return {
          eyesInner: 0.52,
          eyesOutter: 0.82,
          box: 0.60
        }
        break;
    }
  }
  loop () {
    this.canvas = this.faceapi.createCanvasFromMedia(this.video)

    this.canvas.style.position = 'absolute'
    this.canvas.style.left = 0
    this.canvas.style.top = 0

    this.videoWrapper.append(this.canvas)
    const faceapiConfig = {
      width: this.config.width,
      height: this.config.height < this.config.heightAspectRatio
        ? this.config.height
        : this.config.heightAspectRatio
    }
    this.faceapi.matchDimensions(this.canvas, faceapiConfig)
    this.boxesWidth = this.responsiveFrameBoxEyesOutterWidth(window.innerWidth)

    if (this.configFrameBox) this.boxesWidth = this.configFrameBox

    const frameBox = {
      width: Math.floor(this.config.width * this.boxesWidth.box),
      height: this.config.height < this.config.heightAspectRatio
        ? this.config.height
        : this.config.heightAspectRatio
    }
    if (this.configFrameBox?.height) {
      frameBox.height = this.configFrameBox.height
    }
    frameBox.left = Math.floor((this.canvas.width / 2) - (frameBox.width / 2))
    frameBox.top = Math.floor( (this.videoWrapper.clientHeight / 2) - (frameBox.height / 2)  )

    const height = frameBox.height + this.configEyesBoxHeight
    const eyesOutter = {
      width: Math.floor((frameBox.width * this.boxesWidth.eyesOutter)),
      height: Math.floor((height / 5))
    }
    eyesOutter.left = Math.floor((frameBox.left + (frameBox.width / 1.95) - (eyesOutter.width / 1.95)))
    eyesOutter.top = Math.floor(frameBox.top + (frameBox.height * 0.3))

    const eyesInner = {
      width: Math.floor((frameBox.width * this.boxesWidth.eyesInner)),
      height: Math.floor((height / 5))
    }
    eyesInner.left = Math.floor((frameBox.left + (frameBox.width / 1.96) - (eyesInner.width / 1.96)))
    eyesInner.top = Math.floor(frameBox.top + (frameBox.height * 0.3))

    this.ellipseMaskWidth = frameBox.width / 2 
    this.ellipseMaskHeight = frameBox.height / 2.5
    this.ellipseMaskTop = (frameBox.top + frameBox.height) / 1.9
    this.ellipseMaskLeft = eyesOutter.left + (eyesOutter.width / 2)
    this.ellipseMaskLineWidth = 2
    this.createMessageBox()

    const ctx = this.canvas.getContext('2d')
    ctx.translate(this.canvas.width, 0)
    ctx.scale(-1, 1)
    this.drawEllipse(ctx)
    // DEBUG
    if (this.config.isDebug) {
      this.draw(ctx, this.canvas, frameBox, eyesInner, eyesOutter)
    }

    if (!this.isMobile()) {
      this.timerBackground = setInterval(() => {
        this.checkBackground()
      }, 1000);
    } else this.isBackgroundOK = true

    
    const state = {
      counter: 0,
      inProgress: false,
      done: false
    }
    
    const canvasPosition = this.canvas.getBoundingClientRect()
    this.timer = setInterval(async () => {
      if (!navigator.onLine) {
        this.setHasNoNetwork()
        return
      }
      if (state.inProgress || state.done) {
        return
      }
      state.inProgress = true

      const detections = await this.faceapi.detectSingleFace(this.video, new this.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()

      this.removeLoading()

      const limitCounterFaceDiscovery = this.timeToDetectFace / this.facetimeInterval
      if (this.showNotFoundModal && this.counterNotFoundFace > limitCounterFaceDiscovery) {
        this.toggleModalFaceNotFound()
      }

      if (!detections) {
        this.blockMask('Face não encontrada', canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
        state.counter = 0
        state.inProgress = false
        this.counterNotFoundFace++
        return
      } else this.counterNotFoundFace = 0

      const resizedDetections = this.faceapi.resizeResults(detections, {
        width: this.config.width,
        height: this.config.height < this.config.heightAspectRatio
        ? this.config.height
        : this.config.heightAspectRatio
      })

      if (resizedDetections && resizedDetections.expressions && this.shouldCheckNeutralFace) {  
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

        this.ellipseMaskLineWidth *= 2
        this.activateEllipseMask()
    
        state.counter += 1
        state.inProgress = false
        if (state.counter >= 2) {
          state.done = true
          this.takePicture()
          clearInterval(this.timer)
          !!this.timerBackground && clearInterval(this.timerBackground)
        }
      }
      
    }, this.facetimeInterval)
  }

  activateEllipseMask () {
    const ctx = this.canvas.getContext('2d')
    this.drawEllipse(ctx, this.activatedEllipseStrokeStyle)
  }

  deactivateEllipseMask () {
    const ctx = this.canvas.getContext('2d')
    this.ellipseMaskLineWidth = 3
    this.drawEllipse(ctx)
  }
  
  draw (ctx, canvas, frameBox, eyesInner, eyesOutter) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    ctx.lineWidth = 3
    ctx.strokeStyle = 'blue'
    ctx.rect(frameBox.left, frameBox.top, frameBox.width, frameBox.height)
    ctx.stroke()

    ctx.beginPath()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'yellow'
    ctx.rect(eyesInner.left, eyesInner.top, eyesInner.width, eyesInner.height)
    ctx.stroke()
  
    ctx.beginPath()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'red'
    ctx.rect(eyesOutter.left, eyesOutter.top, eyesOutter.width, eyesOutter.height)
    ctx.stroke()
    this.drawEllipse(ctx)
  }


  drawEllipse(ctx, style) {
    const x = this.ellipseMaskLeft
    const y = this.ellipseMaskTop
    const w = this.ellipseMaskWidth
    const h = this.ellipseMaskHeight

    ctx.beginPath()
    ctx.lineWidth = this.ellipseMaskLineWidth

    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2)
    ctx.strokeStyle = style || this.ellipseStrokeStyleDefault

    ctx.stroke();
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


    this.deactivateEllipseMask()

    this.msg.innerHTML = ''
    const elMessage = document.createElement('span')
    elMessage.textContent = message
    elMessage.style = 
    `
      display: flex;
      color: ${this.boxMessageTextColor};
      font-size: 1.1rem;
      padding: 10px 20px;
      text-align: center;
      align-items: center;
      background: ${this.boxMessageBackgroundColor};
      border-radius: 7px;
      justify-content: center;
      width: ${dimensions.width}px;
      font-family: Prompt, sans-serif;
    `
    this.msg.style.display = 'flex'
    this.msg.appendChild(elMessage)
  }
  takePicture () {
    const context = this.canvasBackground.getContext('2d')
    this.canvasBackground.style.display = 'none;'
    this.createFlashMask()
    context.drawImage(this.video, 0, 0, this.canvasBackground.width, this.canvasBackground.height)
    context.fillStyle = "rgb(71,84,68)"
    context.fillRect(20, 50, 1, 1)
    context.fillStyle = "rgb(211,190,124)"
    context.fillRect(422, 522, 1, 1)
    const pictureData = context.getImageData(0,0,this.canvasBackground.width,this.canvasBackground.height)
    context.putImageData(pictureData, 0, 0)
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
    this.canvasLuminance = document.createElement('canvas')
    const width = this.videoWrapper.clientWidth / 2
    const height = this.videoWrapper.clientHeight / 2

    const context = this.canvasLuminance.getContext('2d')

    context.drawImage(this.video, 0, 0, this.canvasLuminance.width, this.canvasLuminance.height)
    const pictureData = context.getImageData(0,0,this.canvasLuminance.width,this.canvasLuminance.height)
    this.sweepVideo(pictureData.data)

    this.isBackgroundOK = (this.brightness >= this.brightnessControl && this.luminance >= this.luminanceControl)

    if (this.config.isDebug) {
      const table = {
        brilho: {
          atual: this.brightness,
          'mín aceitável': this.brightnessControl,
        },
        'luminância': {
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
    flash.style.zIndex = 999
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
    const box = document.getElementById('liveness-box-message')
    if (!!box) box.remove()
    this.msg = document.createElement('div')
    this.msg.id = 'liveness-box-message'
    this.msg.style = `
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      z-index: 999;
      background: transparent;
      position: absolute;
      top: ${this.ellipseMaskTop + this.ellipseMaskHeight}px;
    `
    this.videoWrapper.append(this.msg)
    return this
  }
  toggleModalFaceNotFound () {
    const hasModal = document.getElementById('modal-liveness-face-not-found')
    if (!!hasModal) return

    const modalWrapper = document.createElement('div')
    modalWrapper.id = 'modal-liveness-face-not-found'
    modalWrapper.style = `
    top: 0;
    left: 0;
    z-index: 21;
    width: 100%;
    height: 100%;
    position: fixed;
    display: grid;
    align-items: flex-start;
    justify-content: center;
    background: rgba(20, 20, 20, 0.95);
    `

    const modalFaceNotFound = document.createElement('div')
    modalFaceNotFound.style = `
    gap: 10px;
    margin-top: 50px;
    padding: 15px 10px;
    display: grid;
    background: white;
    border-radius: 7px;
    position: relative;
    align-items: center;
    justify-content: center;
    font-family: Prompt, sans-serif;
    `
    modalFaceNotFound.innerHTML = 
    `
      <h3>Atenção</h3>
      <p style="width: 100%">Não foi possível realizar a captura, tente novamente:</p>
      <ul style="width: 100%; display: grid; gap: 5px;">
        <li>Em um fundo neutro, de preferência com uma parede clara</li>
        <li>Em um ambiente com iluminação neutra (nem muito claro nem muito escuro)</li>
        <li>Removendo os adereços que prejudiquem a visualização da sua face, como cachecol, tocas, bonés e fones</li>
      </ul>
    `
    const confirmButton = document.createElement('button')
    confirmButton.textContent = 'OK'
    confirmButton.style = `
    color: #555;
    right: 10px;
    width: 130px;
    height: 30px;
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
    z-index: 1;
    width: 100%;
    display: flex;
    padding: 10px 0;
    justify-content: center;
    `
    footer.append(confirmButton)
    modalFaceNotFound.append(footer)
    modalWrapper.append(modalFaceNotFound)
    confirmButton.addEventListener('click', () => {
      this.counterNotFoundFace = 0
      const modal = document.getElementById('modal-liveness-face-not-found')
      if (!!modal) {
        modal.remove()
      }
    })
    document.body.append(modalWrapper)

    return this
  }
  createModalConfirmationWrapper () {
    this.modalWrapper = document.createElement('div')
    this.modalWrapper.style = `
    top: 0;
    left: 0;
    z-index: 999;
    width: ${this.videoWrapper.style.width};
    height: ${this.videoWrapper.style.height};
    display: none;
    position: fixed;
    align-items: flex-start;
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
    width: ${this.videoWrapper.style.width};
    height: ${this.videoWrapper.style.height};
    background: white;
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
    z-index: 1;
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
    width: 100%;
    height: 100%;
    max-width: ${this.videoWrapper.clientWidth};
    object-fit: cover;
    border-radius: 7px;
    transform: scaleX(-1);
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

  downloadImage () {
    const anchor = createElement('a')
    anchor.setAttribute('download', 'image.png')
    anchor.setAttribute('href', this.base64)
    anchor.click()
    setTimeout(() => {
      anchor.remove()
    }, 1000);
  }

  setLoading () {
    const hasSpinner = document.getElementById('spinner')
    if (!!hasSpinner) return 

    const spinner = `<div id="spinner">
        <div class="lds-ripple">
          <div style="color: white"></div>
          <div style="color: white"></div>
        </div>
        <div id="spinner-message" />
        <style>
        #spinner {
          top: 0;
          z-index: 999;
          width: 100%;
          height: 100%;
          display: flex;
          position: absolute;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          background: rgba(20, 20, 20, 1);
        }
        #spinner-message {
          width: 100%;
          display: flex;
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

  setLoadingProgress () { 
    const hasSpinner = document.getElementById('spinner')
    if (!!hasSpinner) return 

    const spinner = `<div id="spinner">
        <p class="liveness-progress-text">
          ${
            this.uploadInProgress === 100
            ? '<strong>Aguarde enquanto estamos <br /> analisando a sua selfie</strong>'
            : `Fazendo upload da selfie...<br /> (${this.uploadInProgress?.toFixed(0)}% enviados)`
          }
        </p>
    
        <style>
        #spinner {
          top: 0;
          z-index: 999;
          width: 100%;
          height: 100%;
          display: flex;
          position: absolute;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          background: rgba(20, 20, 20, 1);
        }
        .liveness-progress-text {
          color: white;
          text-align: center;
        }
        .liveness-progress-text strong {
          opacity: 1;
          animation: blink-text 1s ease infinite alternate;
        }
        @keyframes blink-text {
          from {
            opacity: 1;
          }
          to {
            opacity: 0.4;
          }
        }
        </style>
      </div>`
    this.videoWrapper.insertAdjacentHTML('beforeend', spinner)
  }

  getTips () {
    const tips = []

    const proportion = this.canvasBackground.width / this.canvasBackground.height
    if (proportion.toFixed(2) !== '1.33') {
      tips.push('A imagem não está com a proporção adequada. Tente a proporção 4/3 | Por ex.: 640x480, 800x600, 960x720 ou 1024x768')
    }
    if (!this.isMobile() && this.canvasBackground.width <= 320) {
      tips.push(`O tamanho da imagem está com tamanho e proporção adequados para desktop. (${this.canvasBackground.width } x ${this.canvasBackground.height}) porém não para o liveness. Tente usar na configuração inicial o config.scalingFactorForLiveness = 3`)
    }

    if (!this.isMobile() && this.canvasBackground.width > 320 && this.canvasBackground.width <= 515) {
      tips.push(`O tamanho da imagem está com tamanho e proporção adequados para desktop. (${this.canvasBackground.width } x ${this.canvasBackground.height}) porém não para o liveness. Tente usar na configuração inicial o config.scalingFactorForLiveness = 2`)
    }

    if (!this.isMobile() && this.canvasBackground.width > 515 && this.canvasBackground.width < 700) {
      tips.push(`O tamanho da imagem está com tamanho e proporção adequados para desktop. (${this.canvasBackground.width } x ${this.canvasBackground.height}) porém não para o liveness. Tente usar na configuração inicial o config.scalingFactorForLiveness = 1.5`)
    }
    return tips.join(', ')
  }

  removeLoading () {
    const spinner = document.getElementById('spinner')
    if(spinner) spinner.remove()
  }

  setHasNoNetwork () {
    const hasSpinner = document.getElementById('spinner')
    if (!!hasSpinner) return 

    const spinner = `<div id="spinner">
        <div class="lds-ripple">
          <div style="color: white"></div>
          <div style="color: white"></div>
        </div>
        <p>Estamos sem conexão<br />com a internet</p>
        <style>
        #spinner {
          top: 0;
          z-index: 999;
          width: 100%;
          height: 100%;
          display: flex;
          position: absolute;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          background: rgba(20, 20, 20, 1);
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
        #spinner p {
          color: white;
          text-align: center;
          animation: blink 1s linear infinite;
        }

        @keyframes blink {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
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

  async sendPictureByXmlRequest () {
    const endpoint = `${this.livenessUrlBase}${this.livenessConfirmEndpoint}`
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint, true)

    xhr.setRequestHeader('Authorization', `Bearer ${this.token}`)

    xhr.upload.addEventListener('progress', (e) => {
      this.uploadInProgress  = (e.loaded / e.total) * 100

      this.removeLoading()
      this.setLoadingProgress()
    })

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const response = JSON.parse(xhr?.response)

        if (!response?.data?.isAlive) response.tips = this.getTips()

        switch (xhr.status) {
          case 200:
            this.successCallback({...response, base64: this.base64})
            break;
          case 401:
            this.errorCallback({ error: response, base64: this.base64})
            break;
          default:
            this.errorCallback({ error: response, base64: this.base64})
            break;
        }
        this.resetLiveness()
        this.removeLoading()
      }
    }
    if (this.requestType === 'b64') {
      await this.sendBase64(xhr)
    } else {
      await this.sendFormData(xhr)
    }
  }

  async sendBase64 (xhr) {
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(JSON.stringify({
      base64: {
        key: this.toB64()
      }
    }))
  }
  async sendFormData (xhr) {
    const formData = await this.toFormData()
    xhr.send(formData)
  }
  async toFormData () {
    const formData = new FormData()
    const responseFetch = await fetch(this.base64)
    const blob = await responseFetch.blob()
    formData.append('selfie', blob, 'image.png')
    return formData
  }

  toB64 () {
    const base64Local = this.base64
    return base64Local.split(',')[1]
  }

  confirmPicture () {
    try {
      this.sendPictureByXmlRequest()
    } catch (error) {
      this.errorCallback({ error, base64: this.base64})
    }
  }
}

module.exports = Liveness
