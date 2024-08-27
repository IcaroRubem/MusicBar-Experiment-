/* == Equalizator Class == */
// gain -20  20 : 0
// freq  30  20k : varia
// Q    0.1  10 : 1
// >> banda estreita ... banda larga
// 

class Equalizator {
    constructor(fftSize, bandsLenght) {
        this._audioContext = null
        this._analyser = null
        this._distortion = null
        this._biquadFilter = null
        this._convolver = null 
        this._source = null
        this._initialized = false
        this._fftsize = fftSize || 1024
        this._bandsLength = bandsLenght || 5
        this._gain_MinMax = [-6, 6]
        this._types = {
            lowpass: { Q: true, frequency: true },
            highpass: { Q: true, frequency: true },
            bandpass: { Q: true, frequency: true },
            notch: { Q: true, frequency: true },
            allpass: { Q: true, frequency: true },
            peaking: { Q: true, frequency: true, gain: true },
            lowshelf: { frequency: true, gain: true },
            highshelf: { frequency: true, gain: true },
            //"band-reject": { Q: true, frequency: true }
          };
        this._buffer_Length = null
        this._time_Domain_Data = new Uint8Array(this._bandsLength)
        this._float_Time_Domain_Data = new Float32Array(this._bandsLength)
        this._frequency_data = new Uint8Array(this._bandsLength)
        this._float_Frequency_data = new Float32Array(this._bandsLength)
        this._filters = []
    }

    initialize(audioElement) {
        if (!this._initialized) {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)()
            this._analyser = this._audioContext.createAnalyser()
            this._distortion = this._audioContext.createWaveShaper()
            this._source = this._audioContext.createMediaElementSource(audioElement)
            this._convolver = this._audioContext.createConvolver()
            this._analyser.fftSize = this._fftsize
            this._buffer_Length = this._analyser.frequencyBinCount
            this._initialized = true

            this._createBands()
            this._connectBands()
        }
    }

    _createBands() {
        for (let i = 0; i < this._bandsLength; i++) {
            const filter = this._audioContext.createBiquadFilter()
            filter.type = "peaking"
            filter.Q.value = 1
            filter.gain.value = 0
            filter.frequency.value = 32 * Math.pow(2, i)
            this._filters.push(filter)
        }
    }

    _connectBands() {
        this._source.connect(this._filters[0])
        this._filters.reduce((prev, curr) => {
            prev.connect(curr)
            return curr
        }).connect(this._analyser)
        this._analyser.connect(this._audioContext.destination)
    }

    _getByteTimeDomainData() {
        this._analyser.getByteTimeDomainData(this._time_Domain_Data)
        return this._time_Domain_Data
    }

    _getFloatTimeDomainData() {
        this._analyser.getFloatTimeDomainData(this._float_Time_Domain_Data)
        return this._float_Time_Domain_Data
    }

    _getByteFrequencyData() {
        this._analyser.getByteFrequencyData(this._frequency_data)
        return this._frequency_data
    }

    _getFloatFrequencyData() {
        this._analyser.getFloatFrequencyData(this._float_Frequency_data)
        return this._float_Frequency_data
    }
}

const selectFile = select("#file")
const checkType = select("#fill-rect")
const audioElement = select("#audio")
const canvas = select("#canvas")
const canvas2 = select("#canvas2")
const main = select("main")
const raiders = select(".raiders")
const context = canvas.getContext("2d")
const context2 = canvas2.getContext("2d")
const WIDTH = 200
const HEIGHT = 100
const SATUTATION = 255 
let loop = false
let raidersCreated = false

canvas.width = WIDTH
canvas.height = HEIGHT
canvas2.width = WIDTH
canvas2.height = HEIGHT

selectFile.evt("change", changeFile)

//Instance Equalizator
const equalizator = new Equalizator(null, 10)
/* ========================= */

function changeFile(event) {
    equalizator.initialize(audioElement)
    if (!raidersCreated) {
        bandsEventsRaiders()
        raidersCreated = true
    }
    const fileObj = event.target.files[0]
    const fileUrl = URL.createObjectURL(fileObj)
    audioElement.src = fileUrl
}

function bandsEventsRaiders() {
    for (let i = 0; i < equalizator._bandsLength; i++) {
        const raider = createRaider(-10, 10, 0)
        const raiderBox = create("div")
        const bandName = create("label")
        const labelValue = create("label")
        bandName.innerText = `BAND ${i + 1}: `
        labelValue.innerText = "0"
        const filter = equalizator._filters[i]
        raider.evt("input", (event) => {
            const value = event.target.value
            filter.gain.value = value
            labelValue.innerText = value
        })
        raiderBox.classList.toggle("raiderBox")
        raiderBox.add(bandName)
        raiderBox.add(labelValue)
        raiderBox.add(raider)
        raiders.add(raiderBox)
    }
}

function createRaider(min, max, value) {   
    const raider = create("input")
    raider.type = "range"
    raider.min = min || 0
    raider.max = max || 10
    raider.value = value || 0 
    return raider
}

function draw() {
    //context.fillStyle = "#ffffff40";
    //context.fillRect(0, 0, WIDTH, HEIGHT);
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context2.clearRect(0, 0, WIDTH, HEIGHT);
    if (equalizator._initialized) {
        let widthBand = WIDTH / equalizator._bandsLength;
        let data = equalizator._getByteFrequencyData();
        if (checkType.checked) {
            // context.strokeStyle = "#ffffff"
            // context.stroke()
            context.beginPath()
            context.arc(widthBand/2, HEIGHT, 0, 0, 2 * Math.PI);
            context.fill()
        }
        for (let i = 0; i < equalizator._bandsLength; i++) {
            let heightBand = map2(data[i], 0, SATUTATION, 0, HEIGHT);
            let hue = map2(data[i], 0, SATUTATION, 130, 0);
            context.fillStyle = `hsl(${hue}, 100%, 50%)`;
            if (!checkType.checked) {
                context.fillRect(i * widthBand + 1, HEIGHT - heightBand, widthBand, heightBand);
            } else {
                context.arc(i * widthBand + widthBand/2, HEIGHT - heightBand, 0, 0, 2 * Math.PI);
                context.fill()
            }
        }

        if (checkType.checked) {
            context.arc(WIDTH - widthBand/2, HEIGHT, 0, 0, 2 * Math.PI);
            context.fill()
        }


        let data2 = equalizator._getByteTimeDomainData();
        if (checkType.checked) {
            // context.strokeStyle = "#ffffff"
            // context.stroke()
            context2.beginPath()
            context2.arc(widthBand/2, HEIGHT, 0, 0, 2 * Math.PI);
            context2.fill()
        }
        for (let i = 0; i < equalizator._bandsLength; i++) {
            let heightBand = map2(data2[i], 0, SATUTATION, 0, HEIGHT);
            let hue = map2(data2[i], 0, SATUTATION, 130, 0);
            context2.fillStyle = `hsl(${hue}, 100%, 50%)`;
            if (!checkType.checked) {
                context2.fillRect(i * widthBand + 1, HEIGHT - heightBand, widthBand, heightBand);
            } else {
                context2.arc(i * widthBand + widthBand/2, HEIGHT - heightBand, 0, 0, 2 * Math.PI);
                context2.fill()
            }
        }

        if (checkType.checked) {
            context2.arc(WIDTH - widthBand/2, HEIGHT, 0, 0, 2 * Math.PI);
            context2.fill()
        }
    }

    if (!loop) {
        requestAnimationFrame(draw);
    }
}

draw()
