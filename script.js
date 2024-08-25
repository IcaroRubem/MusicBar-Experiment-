/* == Equalizator Class == */
class Equalizator {
    constructor(fftSize, bandsLenght) {
        this._audioContext = null
        this._analyser = null
        this._biquadFilter = null
        this._source = null
        this._initialized = false
        this._fftsize = fftSize || 1024
        this._bandsLength = bandsLenght || 5
        this._gain_MinMax = [-6, 6]
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
            this._source = this._audioContext.createMediaElementSource(audioElement)
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
            //filter.gain.minValue = this._gain_MinMax[0]
            //filter.gain.maxValue = this._gain_MinMax[1]
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
const main = select("main")
const raiders = select(".raiders")
const context = canvas.getContext("2d")
const WIDTH = 300
const HEIGHT = 400
let loop = false
let raidersCreated = false

selectFile.evt("change", changeFile)

//Instance Equalizator
const equalizator = new Equalizator(null, 10)
/* ========================= */

function changeFile(event) {
    equalizator.initialize(audioElement)
    if (!raidersCreated) bandsEventsRaiders()
    const fileObj = event.target.files[0]
    const fileUrl = URL.createObjectURL(fileObj)
    audioElement.src = fileUrl
}

function bandsEventsRaiders() {
    for (let i = 0; i < equalizator._bandsLength; i++) {
        const raider = createRaider()
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

function createRaider(i) {
    
    const raider = create("input")
    raider.type = "range"
    raider.min = -20
    raider.max = 10
    raider.value = 0
    
    return raider
}

function draw() {
    //context.fillStyle = "#ffffff40";
    //context.fillRect(0, 0, WIDTH, HEIGHT);
    context.clearRect(0, 0, WIDTH, HEIGHT);
    if (equalizator._initialized) {
        let widthBand = WIDTH / equalizator._bandsLength;
        let data = equalizator._getByteFrequencyData();
        if (checkType.checked) {
            // context.strokeStyle = "#ffffff"
            // context.stroke()
            context.beginPath()
            context.arc(0, HEIGHT, 2, 0, 2 * Math.PI);
            context.fill()
        }
        for (let i = 0; i < equalizator._bandsLength; i++) {
            let heightBand = map2(data[i], 0, 300, 0, HEIGHT);
            let hue = map2(data[i], 0, 300, 130, 0);
            context.fillStyle = `hsl(${hue}, 100%, 50%)`;
            if (!checkType.checked) {
                context.fillRect(i * widthBand + 1, HEIGHT - heightBand, widthBand, heightBand);
            } else {
                context.arc(i * widthBand, HEIGHT - heightBand, 2, 0, 2 * Math.PI);
                context.fill()
            }
        }

        if (checkType.checked) {
            context.arc(WIDTH, HEIGHT - 2, 2, 0, 2 * Math.PI);
            context.fill()
        }
    }

    if (!loop) {
        requestAnimationFrame(draw);
    }
}

draw()