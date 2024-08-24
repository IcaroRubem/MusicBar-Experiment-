const canvas = select("#cnv");
const audioElement = select("#audio");
const canvasCtx = canvas.getContext("2d");
const file = select("#file");
const check = select("#check")
const checkBG = select("#checkBG")

const WIDTH = 300;
const HEIGHT = 100;
let loop = false;

canvas.width = WIDTH;
canvas.height = HEIGHT;

function select(param) {
  return document.querySelector(param);
}

function waveform(analyser) {
  let mode;
  var normalArray = new Array();
  // if (mode === 'float') {
  //   try {
  //     freqToFloat(freqDomain)
  //     analyser.getFloatTimeDomainData(freqDomain);
  //     return freqDomain; // Converter para array padrão
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }

  // // Usar getByteTimeDomainData como alternativa
  // analyser.getByteTimeDomainData(timeDomain);
  // // Normalizar os valores de 0-255 para -1 a 1
  // return Array.from(timeDomain).map(value => (value - 128) / 128);
  for (var i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] === 'number') {
      bins = arguments[i];
    }
    if (typeof arguments[i] === 'string') {
      mode = arguments[i];
    }
  }

  if (mode) {
    timeToFloat(timeDomain);
    analyser.getFloatTimeDomainData(timeDomain);
    return timeDomain;
  } else {
    timeToInt(timeDomain);
    analyser.getByteTimeDomainData(timeDomain);
    for (var j = 0; j < timeDomain.length; j++) {
      var scaled = map(timeDomain[j], 0, 255, -1, 1);
      normalArray.push(scaled);
    }
    return normalArray;
  }



}

function freqToFloat(freqDomain) {
  if (freqDomain instanceof Float32Array === false) {
    freqDomain = new Float32Array(analyser.frequencyBinCount);
  }
}

function timeToInt(timeDomain) {
  if (timeDomain instanceof Uint8Array === false) {
    timeDomain = new Uint8Array(analyser.frequencyBinCount);
  }
}

function timeToFloat(timeDomain) {
  if (timeDomain instanceof Float32Array === false) {
    timeDomain = new Float32Array(analyser.frequencyBinCount);
  }
}

function map(value, start1, stop1, start2, stop2) {
  // Calcula a proporção do valor no intervalo original
  const proportion = (value - start1) / (stop1 - start1);

  // Retorna o valor no novo intervalo
  return start2 + proportion * (stop2 - start2);
}

function circle(x, y, r) {
  canvasCtx.beginPath();
  canvasCtx.arc(x, y, r, 0, 2 * Math.PI);
  canvasCtx.closePath();
  canvasCtx.fill();
}

// Inicialize o contexto de áudio e o analisador
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const source = audioCtx.createMediaElementSource(audioElement);
const analyser = audioCtx.createAnalyser();

analyser.fftSize = 64;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

//const timeDomain = new Uint8Array(bufferLength);
const floatTimeDomain = new Float32Array(bufferLength);

const freqDomain = new Uint8Array(analyser.frequencyBinCount);
const timeDomain = new Uint8Array(analyser.frequencyBinCount);
let bins = 64

source.connect(analyser);
analyser.connect(audioCtx.destination);

canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

// Função de desenho adaptada
function draw() {
  requestAnimationFrame(draw);

  // Use waveform para obter os dados normalizados
  const waveformData = waveform(analyser);
  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  if (checkBG.checked) {
    canvasCtx.fillStyle = "#ffffff9c";
  } else {
    canvasCtx.fillStyle = "#ffffff00";

  }
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  const barWidth = WIDTH / waveformData.length;
  let barHeight;
  let x = 0;

  // Ajuste a visualização com base nos dados normalizados
  for (let i = 0; i < waveformData.length; i++) {
    barHeight = (waveformData[i] * HEIGHT / 2) + 2; // Ajuste a escala se necessário

    canvasCtx.fillStyle = `hsl(${Math.abs(barHeight) * 2}, 100%, 50%)`;
    if (check.checked) {
      canvasCtx.fillRect(x, HEIGHT / 2, barWidth, barHeight);
    } else {
      circle(x, HEIGHT / 2 + barHeight, barWidth - 6)
    }
    x += barWidth + 1;
  }
}

// Adicione um ouvinte de evento para carregar o arquivo de áudio
file.addEventListener("change", (event) => {
  const fileObj = event.target.files[0];
  audioElement.src = URL.createObjectURL(fileObj);
  if (!loop) {
    draw();
    loop = true;
  }
});
