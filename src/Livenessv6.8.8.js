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
      ellipseMaskWidth: config.ellipseMaskWidth,
      ellipseMaskHeight: config.ellipseMaskHeight,
      ellipseMaskTop: config.ellipseMaskTop,
      ellipseMaskLeft: config.ellipseMaskLeft,
      mobileFacingMode: config.mobileFacingMode || 'user',
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
    this.ignoreFaceRules = config.ignoreFaceRules || false
    this.activateCountdown = config.activateCountdown || false
    this.onRequestDone = config.onRequestDone
    this.onRequestUploadEnd = config.onRequestUploadEnd
    this.onRequestUploadStart = config.onRequestUploadStart
    this.onRequestOpened = config.onRequestOpened
    this.onRequestLoading = config.onRequestLoading
    this.onRequestUnsent = config.onRequestUnsent
    this.validations = !this.ignoreFaceRules
    ? [
      'background',
      'faceLeft',
      'faceRight',
      'insideFrameBox',
      'faceAbove',
      'faceBelow',
      'faceAway',
      'faceCloser',
      'faceNotBetweenEyesBox'
    ]
    : [
      'faceLeft',
      'faceRight',
      'faceAbove',
      'faceBelow',
      'notInsideEllipse'
    ]
    this.validations = config.validations || this.validations
    this.shouldAutoSendToApi = true
    if (config.shouldAutoSendToApi !== undefined) {
      this.shouldAutoSendToApi = config.shouldAutoSendToApi
    }
    this.createCustomEvents()
    this.selectedLang = config.language || 'pt'
    this.languages = {
      pt: {
        unmatchedFace: 'Face não encaixada',
        keepNeutralFace: 'Mantenha expressão neutra',
        centerYourFace: 'Alinhe seu rosto à tela',
        darkEnvironment: 'O ambiente está escuro',
        positionFaceWithinFrame: 'Posicione seu rosto dentro da moldura',
        moveFaceAway: 'Afaste seu rosto',
        moveFaceCloser: 'Aproxime seu rosto',
        moveFaceDown: 'Desça a cabeça para encaixar na moldura',
        moveFaceUp: 'Suba a cabeça para encaixar na moldura',
        moveFaceRight: 'Mova a cabeça para a direita',
        moveFaceLeft: 'Mova a cabeça para a esquerda',
        mediaNotImplemented: 'getUserMedia não implementado nesse browser',
        videoAriaLabel: 'Vídeo da face - Aproxime o rosto em posição de selfie e afaste-o lentamente para enquadrar',
        countdownAriaText: 'contagem regressiva ##counter##',
        countdownText: 'Evite se movimentar agora',
        tiltedFace: 'Seu rosto está inclinado, deixe-o alinhado à tela',
        faceNotFoundModalTitle: 'Atenção',
        faceNotFoundModalDescription: 'Não foi possível realizar a captura, tente novamente',
        faceNotFoundModalTopic1: 'Em um fundo neutro, de preferência com uma parede clara',
        faceNotFoundModalTopic2: 'Em um ambiente com iluminação neutra (nem muito claro nem muito escuro)',
        faceNotFoundModalTopic3: 'Removendo os adereços que prejudiquem a visualização da sua face, como cachecol, tocas, bonés e fones',
        modalAriaPhotoTakenSuccessfully: 'Foto tirada com sucesso',
        modalConfirmButtonText: 'Confirmar',
        modalCancelButtonText: 'Cancelar',
        progressWaitingAccessilityText: 'Aguarde enquanto estamos carregando e analisando a sua selfie',
        finishedUploadHTMLText: '<strong>Aguarde enquanto estamos <br /> analisando a sua selfie</strong>',
        uploadInProgressHTMLText: '<strong>Fazendo upload da selfie...<br /> (##progress##% enviados)</strong>',
        noNetworkHTMLText: 'Estamos sem conexão<br />com a internet',
      },
      en: {
        unmatchedFace: 'Face out of frame',
        keepNeutralFace: 'Keep neutral face',
        centerYourFace: 'Align your face to the screen',
        darkEnvironment: 'The environment is dark',
        positionFaceWithinFrame: 'Position your face within the frame',
        moveFaceAway: 'Move your face away',
        moveFaceCloser: 'Move your face closer',
        moveFaceDown: 'Move your face down to fit within the frame',
        moveFaceUp: 'Move your face up to fit within the frame',
        moveFaceRight: 'Move your face to the right',
        moveFaceLeft: 'Move your face to the left',
        mediaNotImplemented: 'getUserMedia is not implemented in this browser',
        videoAriaLabel: 'face video - approach your face in selfie position and slowly move it away to frame',
        countdownAriaText: 'countdown ##counter##',
        countdownText: 'Avoid moving now',
        tiltedFace: 'face is tilted, leave it aligned to the screen',
        faceNotFoundModalTitle: 'Attention',
        faceNotFoundModalDescription: 'Could not take a photo, try again',
        faceNotFoundModalTopic1: 'In a neutral background, preferably with a light wall',
        faceNotFoundModalTopic2: 'In a neutral lighting environment (neither too bright nor too dark)',
        faceNotFoundModalTopic3: 'Remove any accessories that may impair the view of your face, such as scarves, hats, and headphones',
        modalAriaPhotoTakenSuccessfully: 'Photo taken successfully',
        modalConfirmButtonText: 'Confirm',
        modalCancelButtonText: 'Cancel',
        progressWaitingAccessilityText: 'Wait while we are loading and analyzing your selfie',
        finishedUploadHTMLText: '<strong>Wait while we are <br /> analyzing your selfie</strong>',
        uploadInProgressHTMLText: '<strong>Uploading selfie...<br /> (##progress##% sent)</strong>',
        noNetworkHTMLText: 'We are offline',
      },
      es: {
        unmatchedFace: 'Rostro fuera del círculo',
        keepNeutralFace: 'Mantenga la cara neutra',
        centerYourFace: 'Centre su rostro en la pantalla',
        darkEnvironment: 'El entorno es oscuro',
        positionFaceWithinFrame: 'Posicione su rostro dentro del marco',
        moveFaceAway: 'Mueva su rostro lejos',
        moveFaceCloser: 'Mueva su rostro más cerca',
        moveFaceDown: 'Mueva su rostro hacia abajo para encajar en el marco',
        moveFaceUp: 'Mueva su rostro hacia arriba para encajar en el marco',
        moveFaceRight: 'Mueva su rostro a la derecha',
        moveFaceLeft: 'Mueva su rostro a la izquierda',
        mediaNotImplemented: 'getUserMedia no está implementado en este navegador',
        videoAriaLabel: 'vídeo de la cara - acerque su rostro en posición de selfie y aleje lentamente para enmarcar',
        countdownAriaText: 'contagem regressiva ##counter##',
        countdownText: 'Evite se movimentar agora',
        tiltedFace: 'la cara está inclinada, deje-la alineada a la pantalla',
        faceNotFoundModalTitle: 'Atención',
        faceNotFoundModalDescription: 'No se pudo tomar una foto, intente de nuevo',
        faceNotFoundModalTopic1: 'En un fondo neutro, de preferencia con una pared clara',
        faceNotFoundModalTopic2: 'En un ambiente con iluminación neutra (ni muy claro ni muy oscuro)',
        faceNotFoundModalTopic3: 'Retire cualquier accesorio que pueda perjudicar la vista de su cara, como bufandas, gorras y auriculares',
        modalAriaPhotoTakenSuccessfully: 'Foto tomada con éxito',
        modalConfirmButtonText: 'Confirmar',
        modalCancelButtonText: 'Cancelar',
        progressWaitingAccessilityText: 'Espere mientras estamos cargando y analizando su selfie',
        finishedUploadHTMLText: '<strong>Espere mientras estamos <br /> analizando su selfie</strong>',
        uploadInProgressHTMLText: '<strong>Cargando selfie...<br /> (##progress##% enviados)</strong>',
        noNetworkHTMLText: 'Estamos sin conexión<br /> con la internet',
      },
      ...config.newLanguages
    }
    this.boxMessages = {
      ...this.languages[this.selectedLang],
    }
  }
  createCustomEvents () {
    this.onPhotoTakenEvent = new CustomEvent('onphototaken')
    this.onPreviewOpenEvent = new CustomEvent('onpreviewopen')
    this.onPreviewCloseEvent = new CustomEvent('onpreviewclose')
    this.onUploadStart = new CustomEvent('onuploadstart')
    this.onUploadEnd = new CustomEvent('onuploadend')
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

  setMobileFaceCam () {
    this.config.mobileFacingMode = 'user'
    this.resetLiveness()
  }

  setMobileEnvironmentCam () {
    this.config.mobileFacingMode = 'environment'
    this.resetLiveness()
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
    if (this.video.src) this.video.src = null
    if (this.video.srcObject) this.video.srcObject = null
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
    const acceptedBrowser = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i
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
          return Promise.reject(new Error(this.languages[this.selectedLang]?.mediaNotImplemented))
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
      if (this.isMobile()) constraints.video = { facingMode: this.config.mobileFacingMode }
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
    this.videoWrapper.style.width =  this.config.width + 'px'
    this.videoWrapper.style.height = this.config.height < this.config.heightAspectRatio
    ? this.config.height + 'px'
    : this.config.heightAspectRatio + 'px'

    this.video = document.createElement('video')
    this.video.ariaLabel = this.languages[this.selectedLang]?.videoAriaLabel
    this.video.style.width = 'inherit'
    this.video.style.height = 'inherit'
    if ( this.config.mobileFacingMode === 'user') {
      this.video.style.transform = 'scaleX(-1)'
    }
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
    if(this.videoWrapper) this.videoWrapper.innerHTML = ''
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
    this.blockMaskMessage = this.boxMessages.unmatchedFace 
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
    frameBox.center = (frameBox.left + frameBox.width) / 1.5

    const height = frameBox.height + this.configEyesBoxHeight
    const eyesOutter = {
      width: Math.floor((frameBox.width * this.boxesWidth.eyesOutter)),
      height: Math.floor((height / 5)),
      top: Math.floor(frameBox.top + (frameBox.height * 0.3))
    }
    eyesOutter.left = Math.floor((frameBox.left + (frameBox.width / 1.95) - (eyesOutter.width / 1.95)))

    const eyesInner = {
      width: Math.floor((frameBox.width * this.boxesWidth.eyesInner)),
      height: Math.floor((height / 5)),
      top: Math.floor(frameBox.top + (frameBox.height * 0.3))
    }
    eyesInner.left = Math.floor((frameBox.left + (frameBox.width / 1.96) - (eyesInner.width / 1.96)))

    this.ellipseMaskWidth = !!this.config.ellipseMaskWidth
      ? (frameBox.width / this.config.ellipseMaskWidth)
      :  frameBox.width / 2 
    this.ellipseMaskHeight = !!this.config.ellipseMaskHeight
      ? (frameBox.height / this.config.ellipseMaskHeight)
      :  frameBox.height / 2.5
    this.ellipseMaskTop = !!this.config.ellipseMaskTop
      ? (frameBox.top + frameBox.height) / this.config.ellipseMaskTop
      : (frameBox.top + frameBox.height) / 1.9
    this.ellipseMaskLeft = !!this.config.ellipseMaskLeft
      ? eyesOutter.left + (eyesOutter.width / this.config.ellipseMaskLeft)
      : eyesOutter.left + (eyesOutter.width / 2)
  
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
        this.blockMaskMessage = this.boxMessages.unmatchedFace
        this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
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
            this.blockMaskMessage = `${this.boxMessages.keepNeutralFace} >> ${expression}`
            this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          } else {
            this.blockMaskMessage = this.boxMessages.keepNeutralFace
            this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
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
            this.blockMaskMessage = `${this.boxMessages.centerYourFace} >> ${pose}`
            this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          } else {
            this.blockMaskMessage = this.boxMessages.centerYourFace
            this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
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
            this.blockMaskMessage = `${this.boxMessages.centerYourFace} >> rotacionado`
            this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          } else {
            this.blockMaskMessage = this.boxMessages.centerYourFace
            this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
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
        }
        const rightEye = { 
          meanPosition: [jaw[16].x, jaw[16].y],
        }
        const centerEyes = [jaw[8].x, jaw[8].y]

        const positions = {
          frameboxTop: frameBox.top,
          frameboxLeft: frameBox.left,
          frameboxWidth: frameBox.width,
          frameboxHeight: frameBox.height,
          frameboxCenter: frameBox.center,
          eyesOutterTop: eyesOutter.top,
          eyesOutterLeft: eyesOutter.left,
          eyesOutterWidth: eyesOutter.width,
          eyesOutterHeight: eyesOutter.height,
          eyesInnerTop: eyesInner.top,
          eyesInnerLeft: eyesInner.left,
          eyesInnerWidth: eyesInner.width,
          eyesInnerHeight: eyesInner.height
        }

        if (this.hasBackgroundValidation() && !this.isBackgroundOK) {
          this.blockMaskMessage = this.boxMessages.darkEnvironment
          this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }
        if (this.hasFaceLeftValidation() && this.isFaceLeft(centerEyes, positions)) {
          this.blockMaskMessage = this.boxMessages.moveFaceRight
          this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }
        if (this.hasFaceRightValidation() && this.isFaceRight(centerEyes, positions)) {
          this.blockMaskMessage = this.boxMessages.moveFaceLeft
          this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }
        if (this.hasInsideFrameBoxValidation() && !this.isInsideFramebox(leftEye.meanPosition, rightEye.meanPosition, positions)) {
          this.blockMaskMessage = this.boxMessages.positionFaceWithinFrame
          this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }
        if (this.hasFaceAboveValidation() && this.isFaceAbove(leftEye.meanPosition, rightEye.meanPosition, positions)) {
          this.blockMaskMessage = this.boxMessages.moveFaceDown
          this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }
        if (this.hasFaceBelowValidation() && this.isFaceBelow(leftEye.meanPosition, rightEye.meanPosition, positions)) {
          this.blockMaskMessage = this.boxMessages.moveFaceUp
          this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }
        if (this.hasFaceAwayValidation() && this.isFaceAway(leftEye.meanPosition, rightEye.meanPosition, positions)) {
          this.blockMaskMessage = this.boxMessages.moveFaceCloser
          this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }
        if (this.hasFaceCloserValidation() && this.isFaceCloser(leftEye.meanPosition, rightEye.meanPosition, positions)) {
          this.blockMaskMessage = this.boxMessages.moveFaceAway
          this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }
        if (this.hasFaceNotBetweenEyesBoxValidation() && this.isNotBetweenEyesBoxes(leftEye.meanPosition, rightEye.meanPosition, positions)) {
          this.blockMaskMessage = this.boxMessages.moveFaceCloser
          this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }
        if (this.hasNotInsideEllipeValidation() && this.isNotInsideEllipse(leftEye.meanPosition, rightEye.meanPosition)) {
          this.blockMaskMessage = this.boxMessages.positionFaceWithinFrame
          this.blockMask(canvasPosition, frameBox.left, frameBox.top, frameBox.height, frameBox.width)
          state.counter = 0
          state.inProgress = false
          return
        }

        if (this.ellipseMaskLineWidth < 6) this.ellipseMaskLineWidth *= 2
        
        this.activateEllipseMask()
    
        state.counter += 1
        state.inProgress = false
        if (state.counter >= 2) {
          state.done = true
          clearInterval(this.timer)
          !!this.timerBackground && clearInterval(this.timerBackground)
          this.removeMessageBox()

          if (this.activateCountdown) this.countdown()
          else this.takePicture()

        } else {
          clearInterval(this.counterInterval)
        }
      }
      
    }, this.facetimeInterval)
  }

  hasBackgroundValidation () {
    return this.validations.includes('background')
  }
  hasFaceLeftValidation () {
    return this.validations.includes('faceLeft')
  }
  hasFaceRightValidation () {
    return this.validations.includes('faceRight')
  }
  hasInsideFrameBoxValidation() {
    return this.validations.includes('insideFrameBox')
  }
  hasFaceAboveValidation () {
    return this.validations.includes('faceAbove')
  }
  hasFaceBelowValidation () {
    return this.validations.includes('faceBelow')
  }
  hasFaceAwayValidation () {
    return this.validations.includes('faceAway')
  }
  hasFaceCloserValidation () {
    return this.validations.includes('faceCloser')
  }
  hasFaceNotBetweenEyesBoxValidation () {
    return this.validations.includes('faceNotBetweenEyesBox')
  }
  hasNotInsideEllipeValidation () {
    return this.validations.includes('notInsideEllipse')
  }

  countdown () {
    this.counter = 3
    this.counterInterval = setInterval(() => {
      this.printCountdown()
      this.counter--
      if (this.counter < 0) {
        clearInterval(this.counterInterval)
        this.takePicture()
      }
    }, 1000)
  }

  printCountdown() {
    const hasCounter = document.getElementById('countdown')
    if (!!hasCounter) hasCounter.remove()

    const spinner = `
        <div
          role="alert"
          id="countdown"
          aria-label="${this.languages[this.selectedLang]?.countdownAriaText?.replace('##counter##', this.counter)}"
        >
          <div class="lds-countdown">
            <strong>${this.counter}</strong>
          </div>
          <strong>${this.languages[this.selectedLang]?.countdownText}</strong>
        <style>
        #countdown {
          top: 0;
          gap:3rem;
          z-index: 999;
          width: 100%;
          height: 100%;
          color: white;
          display: flex;
          position: absolute;
          text-align: center;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          background-color: rgba(50, 50, 50, 0.4);
        }
        .lds-countdown {
          width: 80px;
          height: 80px;
          position: relative;
        }
        #countdown > strong {
          font-size: 1.8rem;
          padding: 0.5rem;
          background: black;
          border-radius: 1rem;
        }
        .lds-countdown strong {
          font-size: 5rem;
          padding: 0.5rem;
          background: black;
          border-radius: 1rem;
        }
        </style>
      </div>`
    this.videoWrapper.insertAdjacentHTML('beforeend', spinner) 
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

  isFaceUp (eyePosition = [], elementTop) {
    return eyePosition[1] < elementTop
      ? true
      : false
  }

  isFaceDown (eyePosition = [], elementBottom) {
    return eyePosition[1] > elementBottom
      ? true
      : false
  }

  isFaceLeft (centerEyes, positions) {
    const tolerance = positions.frameboxCenter - (positions.frameboxCenter * -0.05)
    return centerEyes[0] > tolerance
  }

  isFaceRight (centerEyes, positions) {
    const tolerance = positions.frameboxCenter + (positions.frameboxCenter * -0.05)
    return centerEyes[0] < tolerance
  }

  isInsideFramebox (leftEye, rightEye, positions) {
    const framePositions = {
      top: positions.frameboxTop,
      left: positions.frameboxLeft,
      width: positions.frameboxWidth,
      height: positions.frameboxHeight,
    }
    return this.isLeftEyeInsideFramebox(leftEye, framePositions) &&
    this.isRightEyeInsideFramebox(rightEye, framePositions)
  }
  isLeftEyeInsideFramebox (leftEye, positions) {
    return this.isInside(leftEye, positions)
  }
  isRightEyeInsideFramebox (rightEye, positions) {
    return this.isInside(rightEye, positions)
  }

  isFaceAway (leftEye, rightEye, positions) {
    const outterBoxPositions = {
      top: positions.eyesInnerTop,
      left: positions.eyesInnerLeft,
      width: positions.eyesInnerWidth,
      height: positions.eyesInnerHeight,
    }
    return this.isLeftEyeAway(leftEye, outterBoxPositions) &&
    this.isRightEyeAway(rightEye, outterBoxPositions)
  }
  isLeftEyeAway (leftEye, positions) {
    return this.isInside(leftEye, positions)
  }
  isRightEyeAway (rightEye, positions) {
    return this.isInside(rightEye, positions)
  }

  isFaceCloser (leftEye, rightEye, positions) {
    const outterBoxPositions = {
      top: positions.eyesOutterTop,
      left: positions.eyesOutterLeft,
      width: positions.eyesOutterWidth,
      height: positions.eyesOutterHeight,
    }
    return this.isLeftEyeCloser(leftEye, outterBoxPositions) &&
    this.isRightEyeCloser(rightEye, outterBoxPositions)
  }
  isLeftEyeCloser (leftEye, positions) {
    return !this.isInside(leftEye, positions)
  }
  isRightEyeCloser (rightEye, positions) {
    return !this.isInside(rightEye, positions)
  }

  isFaceBelow (leftEye, rightEye, positions) {
    return this.isLeftEyeBelow(leftEye, positions) ||
    this.isRightEyeBelow(rightEye, positions)
  }
  isLeftEyeBelow (leftEye, positions) {
    return leftEye[1] > (positions.eyesOutterTop + positions.eyesOutterHeight)
  }
  isRightEyeBelow (rightEye, positions) {
    return rightEye[1] > (positions.eyesOutterTop + positions.eyesOutterHeight)
  }

  isFaceAbove (leftEye, rightEye, positions) {
    return this.isLeftEyeAbove(leftEye, positions) ||
    this.isRightEyeAbove(rightEye, positions)
  }
  isLeftEyeAbove (leftEye, positions) {
    return leftEye[1] < positions.eyesOutterTop
  }
  isRightEyeAbove (rightEye, positions) {
    return rightEye[1] < positions.eyesOutterTop
  }

  isNotBetweenEyesBoxes (leftEye, rightEye, positions) {
    const leftOk = (rightEye[0] < (positions.eyesOutterLeft + positions.eyesOutterWidth) 
      && rightEye[0] > (positions.eyesInnerLeft + positions.eyesInnerWidth))
    const rightOk = (leftEye[0] > positions.eyesOutterLeft && leftEye[0] < positions.eyesInnerLeft)
    return !(leftOk && rightOk)
  }

  isNotInsideEllipse(leftEye, rightEye) {
    return !(this.isLeftEyeInsideEllipse(leftEye) &&
      this.isRightEyeInsideEllipse(rightEye))
  }

  isLeftEyeInsideEllipse(leftEye) {
    const isTopIn = leftEye[1] > (this.ellipseMaskTop - this.ellipseMaskHeight) && leftEye[1] < (this.ellipseMaskTop + (this.ellipseMaskTop - this.ellipseMaskHeight))
    const isLeftOut = leftEye[0] < this.ellipseMaskLeft && leftEye[0] > (this.ellipseMaskLeft- (this.ellipseMaskWidth / 2))
    return isTopIn && !isLeftOut
  }

  isRightEyeInsideEllipse(rightEye, positions) {
    const isTopIn = rightEye[1] > (this.ellipseMaskTop - this.ellipseMaskHeight) && rightEye[1] < (this.ellipseMaskTop + (this.ellipseMaskTop - this.ellipseMaskHeight))
    const isLeftOut = rightEye[0] < this.ellipseMaskLeft && rightEye[0] > (this.ellipseMaskLeft - (this.ellipseMaskWidth * 4))
    return isTopIn && !isLeftOut
  }

  blockMask (canvasPosition, left, top, height, width) {
    const MASK_WHITE_BORDER = 50
    const dimensions = {
      width: 230,
      height: 35
    }
    dimensions.top = top + height + 20
    dimensions.left = (left + (width / 2)) - (dimensions.width / 2)

    if (this.blockMaskMessage === this.cachedBlockMaskMessage) return
    this.cachedBlockMaskMessage = this.blockMaskMessage
    this.deactivateEllipseMask()

    this.msg.innerHTML = ''
    const elMessage = document.createElement('span')
    elMessage.role = 'alert'
    
    elMessage.ariaLabel = this.blockMaskMessage === this.languages[this.selectedLang]?.centerYourFace
      ? this.languages[this.selectedLang]?.tiltedFace
      : this.blockMaskMessage

    elMessage.textContent = this.blockMaskMessage
    elMessage.style = 
    `
      display: flex;
      color: ${this.boxMessageTextColor};
      font-size: 1.2rem;
      font-weight: 600;
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
  draw (ctx, canvas, frameBox, eyesInner, eyesOutter) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.strokeStyle = 'green'
    ctx.rect(frameBox.center, frameBox.top, 2, frameBox.height)
    ctx.stroke()

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
  takePicture () {
    const ctx = this.canvasBackground.getContext('2d')
    this.canvasBackground.style.display = 'none;'
    this.createFlashMask()
    ctx.drawImage(this.video, 0, 0, this.canvasBackground.width, this.canvasBackground.height)
    ctx.fillStyle = "#475444"
    ctx.fillRect(20, 50, 1, 1)
    ctx.fillStyle = "#D3BE7C"
    ctx.fillRect(422, 522, 1, 1)
    const pictureData = ctx.getImageData(0,0,this.canvasBackground.width,this.canvasBackground.height)
    ctx.putImageData(pictureData, 0, 0)
    this.base64 = this.canvasBackground.toDataURL('image/png')
    window.dispatchEvent(this.onPhotoTakenEvent)

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
      // console.table(table)
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
  removeMessageBox () {
    const box = document.getElementById('liveness-box-message')
    if (!!box) box.remove()
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
      <h3>${this.languages[this.selectedLang]?.faceNotFoundModalTitle}</h3>
      <p role="alert" style="width: 100%">${this.languages[this.selectedLang]?.faceNotFoundModalDescription}:</p>
      <ul style="width: 100%; display: grid; gap: 5px;">
        <li>${this.languages[this.selectedLang]?.faceNotFoundModalTopic1}</li>
        <li>${this.languages[this.selectedLang]?.faceNotFoundModalTopic2}</li>
        <li>${this.languages[this.selectedLang]?.faceNotFoundModalTopic3}</li>
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
    confirmButton.focus()

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
    this.modalConfirmation.ariaLabel = this.languages[this.selectedLang]?.modalAriaPhotoTakenSuccessfully
    this.modalConfirmation.role = 'alert'
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
    confirmButton.textContent = this.languages[this.selectedLang]?.modalConfirmButtonText
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
    cancelButton.textContent = this.languages[this.selectedLang]?.modalCancelButtonText
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
      this.closePreviewModal()
      this.cancelPicture()
    })
    confirmButton.focus()
    return this
  }

  openPreviewModal () {
    window.dispatchEvent(this.onPreviewOpenEvent)
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
    if (modal) {
      modal.remove()
      window.dispatchEvent(this.onPreviewCloseEvent)
    }
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

  setLoadingAccessibilityProgress () {
    this.removeLoadingAccessibilityProgress()
    
    const spinner = `<div id="spinneracc" role="alert" style="opacity: 0">
        <p class="liveness-progress-text-accessibility">
          ${this.languages[this.selectedLang]?.progressWaitingAccessilityText}
        </p>
      </div>`
    this.videoWrapper.insertAdjacentHTML('beforeend', spinner)
  }
  removeLoadingAccessibilityProgress () {
    const hasSpinner = document.getElementById('spinneracc')
    if (hasSpinner) hasSpinner.remove() 
  }
  setLoadingProgress () { 
    const hasSpinner = document.getElementById('spinner')
    if (!!hasSpinner) return 

    const spinner = `<div id="spinner">
        <p class="liveness-progress-text">
          ${
            this.uploadInProgress === 100
            ? this.languages[this.selectedLang]?.finishedUploadHTMLText
            : this.languages[this.selectedLang]?.uploadInProgressHTMLText?.replace('##progress##', this.uploadInProgress?.toFixed(0))
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
          font-size: 1.2rem;
          font-weight: 500;
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

  getTips (xhr) {
    const tips = []
    const response = JSON.parse(xhr?.response)

    if (xhr.status === 401) {
      tips.push(`Verifique seu token. Token inválido ou não possui permissão para esse produto::${response?.error?.message}`)
      return tips.join(', ')
    }
    if (xhr.status >= 500) {
      tips.push(`Ocorreu um erro no servidor::${response?.error?.message}`)
      return tips.join(', ')
    }

    tips.push(`Tamanho do video: ${this.videoWrapper.style.width} x ${this.videoWrapper.style.height}. Tamanho enviado para a API: ${this.canvasBackground.width}px x ${this.canvasBackground.height}px`)

    const calcAspectRatio = this.canvasBackground.width / this.canvasBackground.height
    if (calcAspectRatio.toFixed(2) !== '1.33') {
      tips.push('A imagem não está com a proporção adequada. Tente a proporção 4/3 | Por ex.: 640x480, 800x600, 960x720 ou 1024x768')
    }
    if (!this.isMobile() && this.canvasBackground.width <= 320) {
      tips.push(`O tamanho da imagem está com tamanho e proporção adequados para desktop, porém não para o liveness. Tente usar na configuração inicial o config.scalingFactorForLiveness = 3`)
    }

    if (!this.isMobile() && this.canvasBackground.width > 320 && this.canvasBackground.width <= 515) {
      tips.push(`O tamanho da imagem está com tamanho e proporção adequados para desktop, porém não para o liveness. Tente usar na configuração inicial o config.scalingFactorForLiveness = 2`)
    }

    if (!this.isMobile() && this.canvasBackground.width > 515 && this.canvasBackground.width < 700) {
      tips.push(`O tamanho da imagem está com tamanho e proporção adequados para desktop, porém não para o liveness. Tente usar na configuração inicial o config.scalingFactorForLiveness = 1.5`)
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
        <p>${this.languages[this.selectedLang]?.noNetworkHTMLText}</p>
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
          font-size: 1.2rem;
          font-weight: 500;
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

    xhr.upload.addEventListener('loadstart', (e) => {
      if (this.onRequestUploadStart) {
        this.onRequestUploadStart(e)
        return
      }
      this.stop()
      this.setLoadingAccessibilityProgress()
      window.dispatchEvent(this.onUploadStart)
    })

    xhr.upload.addEventListener('loadend', (e) => {
      if (this.onRequestUploadEnd) {
        this.onRequestUploadEnd(e)
        return
      }
      window.dispatchEvent(this.onUploadEnd)
      this.removeLoadingAccessibilityProgress()
    })

    xhr.upload.addEventListener('progress', (e) => {
      this.uploadInProgress  = (e.loaded / e.total) * 100
      this.removeLoading()
      this.setLoadingProgress()
    })

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.OPENED) {
        this.onRequestOpened && this.onRequestOpened(xhr)
      }
      if (xhr.readyState === XMLHttpRequest.LOADING) {
        this.onRequestLoading && this.onRequestLoading(xhr)
      }
      if (xhr.readyState === XMLHttpRequest.UNSENT) {
        this.onRequestUnsent && this.onRequestUnsent(xhr)
      }
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const response = JSON.parse(xhr?.response)

        if (!response?.data?.isAlive) response.tips = this.getTips(xhr)

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
        if (this.onRequestDone) {
          this.onRequestDone(xhr)
          return
        }
        this.resetLiveness()
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
      if (this.shouldAutoSendToApi) this.sendPictureByXmlRequest()
    } catch (error) {
      this.errorCallback({ error, base64: this.base64})
    }
  }
  sendToApi () {
    try {
      this.sendPictureByXmlRequest()
    } catch (error) {
      this.errorCallback({ error, base64: this.base64})
    }
  }
}

module.exports = Liveness
