const video = document.getElementById('video');

/*Verificar si estan bien las direcciones, generalmente aqui hay un problema*/
Promise.all([
  /*faceapi.nets.faceRecognitionNet.loadFromUri('/test-login/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/test-login/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/test-login/models')*/

  faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/michaelvargasloza/reconocimiento-rostros/master/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/michaelvargasloza/reconocimiento-rostros/master/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('https://raw.githubusercontent.com/michaelvargasloza/reconocimiento-rostros/master/models')
]).then(startVideo)

function startVideo(){
  //Obsoleto en Firefox
  /*navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
		err => console.error(err)
	)*/

  navigator.mediaDevices.getUserMedia({ audio: false, video: true}).then((stream) => {
    video.srcObject = stream
  })
  .catch((err) => {
    //Nota: Verificar que sólo una aplicación esté haciendo uso de la cámara
    console.log(err)
  })

  recognizeFaces()
}

video.addEventListener('play', () => {
  recognizeFaces()
})

async function recognizeFaces() {
  const labeledDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6)
  
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    
    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor)
    })
    
    results.forEach( (result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    })
  }, 100)
}

function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Hawkeye' , 'Jim Rhodes', 'Tony Stark', 'Thor', 'Captain Marvel', 'Michael', 'Auron']
  return Promise.all(
    labels.map(async (label)=>{
      const descriptions = []
      for(let i=1; i<=2; i++) {
        //const img = await faceapi.fetchImage(`/test-login/labeled_images/${label}/${i}.jpg`)
        //const img = await faceapi.fetchImage(`http://18.190.65.182/test-login/labeled_images/${label}/${i}.jpg`)
        //const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/michaelvargasloza/reconocimiento-imagenes/master/labeled_images/${label}/${i}.jpg`)
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/michaelvargasloza/reconocimiento-rostros/master/labeled_images/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}