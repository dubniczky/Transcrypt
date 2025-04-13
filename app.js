// Set defaults
const defaultInputFormat = 'text'
const defaultOutputFormat = 'hex'

// Load controls
const fromFormatSelector = document.getElementById("from-format")
const toFormatSelector = document.getElementById("to-format")
const inputText = document.getElementById("input-text")
const outputText = document.getElementById("output-text")
const convertButton = document.getElementById("convert-button")
const switchButton = document.getElementById("switch-button")
const copyButton = document.getElementById("copy-button")
const moveButton = document.getElementById("move-button")
const outputSizeLabel = document.getElementById("output-size")
const ignoreLineBreaksCheckbox = document.getElementById("ignore-line-breaks")
console.log("Loaded controls.")

const casingSelector = document.getElementById("casing-selector")
const casingOptions = document.querySelectorAll(".casing-option")

casingOptions.forEach(option => {
    option.addEventListener("click", () => {
        casingOptions.forEach(opt => opt.classList.remove("active"))
        option.classList.add("active")
        convertEvent()
    })
})

fromFormats = {
    'text': {
        'name': 'Text',
        'validator': input => true
    },
    'hex': {
        'name': 'HEX',
        'validator': input => /^[0-9a-fA-F]+$/.test(input)
    },
    'base64': {
        'name': 'Base64',
        'validator': input => /^[A-Za-z0-9+/=]+$/.test(input)
    },
    'base64url': {
        'name': 'Base64 URL',
        'validator': input => /^[A-Za-z0-9-_]+$/.test(input)
    },
    'url': {
        'name': 'URL Encoding',
        'validator': input => {
            try {
                decodeURIComponent(input)
                return true
            } catch {
                return false
            }
        }
    },
    'morse': {
        'name': 'Morse Code',
        'validator': input => /^[\s.-]+$/.test(input),
    },
    // 'binary': {
    //     'name': 'Binary',
    //     'validator': input => /^[01\s]+$/.test(input),
    // }
}

toFormats = {
    'text': {
        'name': 'Text',
    },
    'hex': {
        'name': 'HEX',
    },
    'base64': {
        'name': 'Base64',
    },
    'url': {
        'name': 'URL Encoding',
    },
    'base64url': {
        'name': 'Base64 URL',
    },
    'morse': {
        'name': 'Morse Code',
    },

    // Hashes
    'md5': {
        'name': 'MD5 Hash',
    },
    'sha1': {
        'name': 'SHA1 Hash',
    },
    'sha256': {
        'name': 'SHA256 Hash',
    },
    'sha512': {
        'name': 'SHA512 Hash',
    },
    'sha3': {
        'name': 'SHA3 Hash',
    },
    'sha512-256': {
        'name': 'SHA512/256 Hash',
    },

    // Checksums
    'crc32': {
        'name': 'CRC32 Checksum',
    },
}

// Load query prams
const urlParams = new URLSearchParams(window.location.search)
inputFormat = urlParams.get('from')
outputFormat = urlParams.get('to')


// Add formats to the selector
for (const [key, value] of Object.entries(fromFormats)) {
    option = document.createElement("option")
    option.value = key
    option.text = value.name
    fromFormatSelector.appendChild(option)
}
if (inputFormat != null && inputFormat in fromFormats) {
    fromFormatSelector.value = inputFormat
    console.log(`Input format set to ${inputFormat} from query params`)
}
else {
    fromFormatSelector.value = defaultInputFormat
}

for (const [key, value] of Object.entries(toFormats)) {
    option = document.createElement("option")
    option.value = key
    option.text = value.name
    toFormatSelector.appendChild(option)
}
if (outputFormat != null && outputFormat in toFormats) {
    toFormatSelector.value = outputFormat
    console.log(`Output format set to ${outputFormat} from query params`)
}
else {
    toFormatSelector.value = defaultOutputFormat
}

console.log(`Added ${Object.keys(fromFormats).length} formats to input format selector.`)
console.log(`Added ${Object.keys(toFormats).length} formats to output format selector.`)

// Set default input value
updateQueryParams(fromFormatSelector.value, toFormatSelector.value)



// Add event listeners
fromFormatSelector.addEventListener("change", function() {
    console.log("From format changed to " + fromFormatSelector.value)
    updateQueryParams(fromFormatSelector.value, toFormatSelector.value)
    convertEvent()
})
toFormatSelector.addEventListener("change", function() {
    console.log("To format changed to " + toFormatSelector.value)
    updateQueryParams(fromFormatSelector.value, toFormatSelector.value)
    convertEvent()
})
inputText.addEventListener("input", function() {
    updateInputValidation()
    convertEvent()
})
convertButton.addEventListener("click", function() {
    console.log("Convert button clicked")
    convertEvent()
})
switchButton.addEventListener("click", function() {
    console.log("Switch button clicked")
    fromFormat = fromFormatSelector.value
    toFormat = toFormatSelector.value
    fromFormatSelector.value = toFormat
    toFormatSelector.value = fromFormat
    updateQueryParams(fromFormatSelector.value, toFormatSelector.value)
    convertEvent()
})
copyButton.addEventListener("click", function() {
    console.log("Copy button clicked")
    navigator.clipboard.writeText(outputText.value).then(function() {
        console.log("Copied to clipboard")
    }, function(err) {
        console.error("Could not copy text: ", err)
    })
})
moveButton.addEventListener("click", function() {
    console.log("Move button clicked")
    inputText.value = outputText.value
    outputText.value = ""
    convertEvent()
})
ignoreLineBreaksCheckbox.addEventListener("change", function() {
    console.log("Ignore line breaks checkbox changed to " + ignoreLineBreaksCheckbox.checked)
    convertEvent()
})


// Helper functions
function updateQueryParams(from, to) {
    const url = new URL(window.location.href)
    url.searchParams.set('from', from)
    url.searchParams.set('to', to)
    window.history.pushState({}, '', url)
}

function validateInput(format, input) {
    if (format in fromFormats) {
        return fromFormats[format].validator(input)
    }
    return false
}

function updateInputValidation() {
    const isValid = validateInput(fromFormatSelector.value, inputText.value)
    if (isValid) {
        inputText.classList.remove("is-invalid")
        return true
    } else {
        inputText.classList.add("is-invalid")
        updateOutput("")
        return false
    }
}

function updateOutput(output) {
    const outputSize = output.length
    outputSizeLabel.innerText = `[${outputSize}]`
    outputText.value = applyCasing(output)
}

function applyCasing(output) {
    const activeCasing = document.querySelector(".casing-option.active").dataset.casing
    if (activeCasing === "uppercase") {
        return output.toUpperCase()
    } else if (activeCasing === "lowercase") {
        return output.toLowerCase()
    }
    return output
}

function preprocessInput(input) {
    if (ignoreLineBreaksCheckbox.checked) {
        return input.replace(/(\r\n|\n|\r)/gm, "") // Remove all line breaks
    }
    return input
}

function convertEvent() {
    fromFormat = fromFormatSelector.value
    toFormat = toFormatSelector.value
    input = preprocessInput(inputText.value) // Preprocess input

    if (!updateInputValidation()) {
        return
    }

    if (fromFormat == toFormat) {
        updateOutput(input)
        return
    }

    const convertedOutput = converters[fromFormat][toFormat](input)
    updateOutput(convertedOutput)
}

converters = {
    'text': {
        'hex': textToHex,
        'base64': btoa,
        'url': encodeURIComponent,
        'md5': function(text) {
            const md5 = CryptoJS.MD5(text)
            return md5.toString()
        },
        'base64url': function(text) {
            const base64 = btoa(text)
            return base64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
        },
        'morse': text => textToMorse(text),

        'sha1': text => bytesToSha1(CryptoJS.enc.Utf8.parse(text)),
        'sha256': text => bytesToSha256(CryptoJS.enc.Utf8.parse(text)),
        'sha512': text => bytesToSha512(CryptoJS.enc.Utf8.parse(text)),
        'sha3': text => bytesToSha3(CryptoJS.enc.Utf8.parse(text)),
        'sha512-256': text => bytesToSha512_256(CryptoJS.enc.Utf8.parse(text)),
        'md5': text => bytesToMd5(CryptoJS.enc.Utf8.parse(text)),

        'crc32': text => bytesToCrc32(CryptoJS.enc.Utf8.parse(text)),
    },
    'hex': {
        'text': hexToText,
        'base64': function(hex) { return btoa(hexToText(hex)) },
        'url': function(hex) { return encodeURIComponent(hexToText(hex)) },
        'md5': function(hex) {
            const bytes = CryptoJS.enc.Hex.parse(hex)
            const md5 = CryptoJS.MD5(bytes)
            return md5.toString()
        },
        'base64url': function(hex) {
            const base64 = btoa(hexToText(hex))
            return base64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
        },
        'morse': hex => textToMorse(hexToText(hex)),

        'md5': hex => bytesToSha1(CryptoJS.enc.Hex.parse(hex)),
        'sha1': hex => bytesToSha1(CryptoJS.enc.Hex.parse(hex)),
        'sha256': hex => bytesToSha256(CryptoJS.enc.Hex.parse(hex)),
        'sha512': hex => bytesToSha512(CryptoJS.enc.Hex.parse(hex)),
        'sha3': hex => bytesToSha3(CryptoJS.enc.Hex.parse(hex)),
        'sha512-256': hex => bytesToSha512_256(CryptoJS.enc.Hex.parse(hex)),

        'crc32': hex => bytesToCrc32(CryptoJS.enc.Hex.parse(hex)),
    },
    'base64': {
        'text': atob,
        'hex': function(base64) { return textToHex(atob(base64)) },
        'url': function(base64) { return encodeURIComponent(atob(base64)) },
        'md5': function(base64) {
            const bytes = CryptoJS.enc.Base64.parse(base64)
            const md5 = CryptoJS.MD5(bytes)
            return md5.toString()
        },
        'base64url': function(base64) {
            const base64url = base64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
            return base64url
        },
        'morse': hex => textToMorse(atob(base64)),

        'sha1': base64 => bytesToSha1(CryptoJS.enc.Base64.parse(base64)),
        'sha256': base64 => bytesToSha256(CryptoJS.enc.Base64.parse(base64)),
        'sha512': base64 => bytesToSha512(CryptoJS.enc.Base64.parse(base64)),
        'sha3': base64 => bytesToSha3(CryptoJS.enc.Base64.parse(base64)),
        'sha512-256': base64 => bytesToSha512_256(CryptoJS.enc.Base64.parse(base64)),

        'crc32': base64 => bytesToCrc32(CryptoJS.enc.Base64.parse(base64)),
    },
    'base64url': {
        'text': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            return atob(base64)
        },
        'hex': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            return textToHex(atob(base64))
        },
        'base64': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            return base64
        },
        'url': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            return encodeURIComponent(atob(base64))
        },
        'morse': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            return textToMorse(atob(base64))
        },

        'md5': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            const bytes = CryptoJS.enc.Base64.parse(base64)
            const md5 = CryptoJS.MD5(bytes)
            return md5.toString()
        },
        'sha1': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            const bytes = CryptoJS.enc.Base64.parse(base64)
            const sha1 = bytesToSha1(bytes)
            return sha1
        },
        'sha256': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            const bytes = CryptoJS.enc.Base64.parse(base64)
            const sha256 = bytesToSha256(bytes)
            return sha256
        },
        'sha512': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            const bytes = CryptoJS.enc.Base64.parse(base64)
            const sha512 = bytesToSha512(bytes)
            return sha512
        },
        'sha3': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            const bytes = CryptoJS.enc.Base64.parse(base64)
            const sha3 = bytesToSha3(bytes)
            return sha3
        },
        'sha512-256': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            const bytes = CryptoJS.enc.Base64.parse(base64)
            const sha512_256 = bytesToSha512_256(bytes)
            return sha512_256
        },

        'crc32': function(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
            const bytes = CryptoJS.enc.Base64.parse(base64)
            const crc32 = bytesToCrc32(bytes)
            return crc32
        },
    },
    'url': {
        'text': decodeURIComponent,
        'hex': function(url) { return textToHex(decodeURIComponent(url)) },
        'base64': function(url) { return btoa(decodeURIComponent(url)) },
        'base64url': function(url) {
            const base64 = btoa(decodeURIComponent(url))
            return base64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
        },
        'morse': url => textToMorse(decodeURIComponent(url)),

        'md5': function(url) {
            const bytes = CryptoJS.enc.Utf8.parse(decodeURIComponent(url))
            const md5 = CryptoJS.MD5(bytes)
            return md5.toString()
        },
        'sha1': url => bytesToSha1(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
        'sha256': url => bytesToSha256(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
        'sha512': url => bytesToSha512(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
        'sha3': url => bytesToSha3(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
        'sha512-256': url => bytesToSha512_256(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),

        'crc32': url => bytesToCrc32(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
    },
    'morse': {
        'text': morseToText,
        'hex': function(morse) { return textToHex(morseToText(morse)) },
        'base64': function(morse) { return btoa(morseToText(morse)) },
        'url': function(morse) { return encodeURIComponent(morseToText(morse)) },
        'base64url': function(morse) {
            const base64 = btoa(morseToText(morse))
            return base64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
        },

        'md5': function(morse) {
            const bytes = CryptoJS.enc.Utf8.parse(morseToText(morse))
            const md5 = CryptoJS.MD5(bytes)
            return md5.toString()
        },
        'sha1': function(morse) {
            const bytes = CryptoJS.enc.Utf8.parse(morseToText(morse))
            const sha1 = bytesToSha1(bytes)
            return sha1
        },
        'sha256': function(morse) {
            const bytes = CryptoJS.enc.Utf8.parse(morseToText(morse))
            const sha256 = bytesToSha256(bytes)
            return sha256
        },
        'sha512': function(morse) {
            const bytes = CryptoJS.enc.Utf8.parse(morseToText(morse))
            const sha512 = bytesToSha512(bytes)
            return sha512
        },
        'sha3': function(morse) {
            const bytes = CryptoJS.enc.Utf8.parse(morseToText(morse))
            const sha3 = bytesToSha3(bytes)
            return sha3
        },
        'sha512-256': function(morse) {
            const bytes = CryptoJS.enc.Utf8.parse(morseToText(morse))
            const sha512_256 = bytesToSha512_256(bytes)
            return sha512_256
        },

        'crc32': function(morse) {
            const bytes = CryptoJS.enc.Utf8.parse(morseToText(morse))
            const crc32 = bytesToCrc32(bytes)
            return crc32
        },
    }
}

function textToHex(str) {
    let hex = ''
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16)
    }
    return hex
}

function hexToText(hex) {
    let str = ''
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    }
    return str
}

function bytesToSha1(bytes) {
    const hash = CryptoJS.SHA1(bytes)
    return hash.toString()
}
function bytesToSha256(bytes) {
    const hash = CryptoJS.SHA256(bytes)
    return hash.toString()
}
function bytesToSha512(bytes) {
    const hash = CryptoJS.SHA512(bytes)
    return hash.toString()
}
function bytesToSha3(bytes) {
    const hash = CryptoJS.SHA3(bytes)
    return hash.toString()
}
function bytesToSha512_256(bytes) {
    const hash = CryptoJS.SHA512(bytes).toString(CryptoJS.enc.Hex)
    return hash.slice(0, 64)
}
function bytesToMd5(bytes) {
    const hash = CryptoJS.MD5(bytes)
    return hash.toString()
}

// Validate all formats have a valid conversion
for (const inputFormat of Object.keys(fromFormats)) {
    for (const outputFormat of Object.keys(toFormats)) {
        if (inputFormat == outputFormat) continue
        // Check if the converter exists
        if (!(inputFormat in converters) || !(outputFormat in converters[inputFormat])) {
            console.error(`Missing converter for ${inputFormat} to ${outputFormat}`)
        }
    }
}

// Do a conversion on load in case the user has a value in the input field and they are just refreshing the page
convertEvent()
