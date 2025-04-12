// Set defaults
const defaultInputFormat = 'text'
const defaultOutputFormat = 'hex'
const defaultInput = ''

// Load controls
fromFormatSelector = document.getElementById("from-format")
toFormatSelector = document.getElementById("to-format")
inputText = document.getElementById("input-text")
outputText = document.getElementById("output-text")
convertButton = document.getElementById("convert-button")
switchButton = document.getElementById("switch-button")
copyButton = document.getElementById("copy-button")
moveButton = document.getElementById("move-button")
outputSizeLabel = document.getElementById("output-size")
console.log("Loaded controls.")

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
    }
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
inputText.value = defaultInput



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
    outputText.value = output
}

function convertEvent() {
    fromFormat = fromFormatSelector.value
    toFormat = toFormatSelector.value
    input = inputText.value

    if (!updateInputValidation()) {
        return
    }

    if (fromFormat == toFormat) {
        outputText.value = input
        return
    }

    updateOutput(converters[fromFormat][toFormat](input))
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

console.log(CryptoJS.enc.Utf8.parse('asd'))