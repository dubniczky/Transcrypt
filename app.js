// Set defaults
const defaultInputFormat = 'text'
const defaultOutputFormat = 'hex'
const fromFormats = {
    'text': {
        'name': 'Text',
        'validator': input => true
    },
    'hex': {
        'name': 'HEX',
        'validator': input => {
            try {
                Uint8Array.fromHex(input)
                return true
            } catch {
                return false
            }
        }
    },
    'base64': {
        'name': 'Base64',
        'validator': input => {
            try {
                Uint8Array.fromBase64(input)
                return true
            } catch {
                return false
            }
        }
    },
    'base64url': {
        'name': 'Base64 URL',
        'validator': input => {
            try {
                Uint8Array.fromBase64(b64UrlToB64(input))
                return true
            } catch {
                return false
            }
        }
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
    'bytes': {
        'name': 'Byte Array',
        'validator': input => {
            const bytes = input.split(' ')
            for (let i = 0; i < bytes.length; i++) {
                if (isNaN(parseInt(bytes[i])) || parseInt(bytes[i]) < 0 || parseInt(bytes[i]) > 255) {
                    return false
                }
            }
            return true
        }
    },
    'binary': {
        'name': 'Binary',
        'validator': input => /^[01\s]+$/.test(input),
    }
}
//f10e2821bbbea527ea02200352313bc059445190

const toFormats = {
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
    'bytes': {
        'name': 'Byte Array',
    },
    'binary': {
        'name': 'Binary',
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
const casingSelector = document.getElementById("casing-selector")
const casingOptions = document.querySelectorAll(".casing-option")
console.log("Loaded controls.")



// Load query prams and set formats
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
casingOptions.forEach(option => {
    option.addEventListener("click", () => {
        casingOptions.forEach(opt => opt.classList.remove("active"))
        option.classList.add("active")
        convertEvent()
    })
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
    const fromFormat = fromFormatSelector.value
    const toFormat = toFormatSelector.value
    const input = preprocessInput(inputText.value) // Preprocess input

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

const converters = {
    'text': {
        'hex': textToHex,
        'base64': text => btoa(text), // Has to be a lambda, otherwise it will compain about missing the Window context
        'url': encodeURIComponent,
        'base64url': text => b64ToB64Url(btoa(text)),
        'morse': text => textToMorse(text),
        'bytes': text => new TextEncoder().encode(text).join(' '),
        'binary': text => bytesToBinary(CryptoJS.enc.Utf8.parse(text)),
        
        'md5': text => bytesToMd5(CryptoJS.enc.Utf8.parse(text)),
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
        'base64': hex => btoa(hexToText(hex)),
        'url': hex => encodeURIComponent(hexToText(hex)),
        'base64url': hex => b64ToB64Url(btoa(hexToText(hex))),
        'morse': hex => textToMorse(hexToText(hex)),
        'bytes': hex => hexToBytes(hex).join(' '),
        'binary': hex => bytesToBinary(hexToBytes(hex)),

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
        'hex': base64 => textToHex(atob(base64)),
        'url': base64 => encodeURIComponent(atob(base64)),
        'base64url': b64ToB64Url,
        'morse': hex => textToMorse(atob(hex)),
        'bytes': base64 => wordarrayToBytes(CryptoJS.enc.Base64.parse(base64)).join(' '),
        'binary': base64 => bytesToBinary(CryptoJS.enc.Base64.parse(base64)),

        'md5': base64 => bytesToMd5(CryptoJS.enc.Base64.parse(base64)),
        'sha1': base64 => bytesToSha1(CryptoJS.enc.Base64.parse(base64)),
        'sha256': base64 => bytesToSha256(CryptoJS.enc.Base64.parse(base64)),
        'sha512': base64 => bytesToSha512(CryptoJS.enc.Base64.parse(base64)),
        'sha3': base64 => bytesToSha3(CryptoJS.enc.Base64.parse(base64)),
        'sha512-256': base64 => bytesToSha512_256(CryptoJS.enc.Base64.parse(base64)),

        'crc32': base64 => bytesToCrc32(CryptoJS.enc.Base64.parse(base64)),
    },
    'base64url': {
        'text': b64u => atob(b64UrlToB64(b64u)),
        'hex': b64u => textToHex(atob(b64UrlToB64(b64u))),
        'base64': b64u => b64UrlToB64(b64u),
        'url': b64u => encodeURIComponent(atob(b64UrlToB64(b64u))),
        'morse': b64u => textToMorse(atob(b64UrlToB64(b64u))),
        'bytes': b64u => wordarrayToBytes(CryptoJS.enc.Base64.parse(b64UrlToB64(b64u))).join(' '),
        'binary': b64u => bytesToBinary(CryptoJS.enc.Base64.parse(b64UrlToB64(b64u))),

        'md5': b64u => bytesToMd5(CryptoJS.enc.Base64.parse(b64UrlToB64(b64u))),
        'sha1': b64u => bytesToSha1(CryptoJS.enc.Base64.parse(b64UrlToB64(b64u))),
        'sha256': b64u => bytesToSha256(CryptoJS.enc.Base64.parse(b64UrlToB64(b64u))),
        'sha512': b64u => bytesToSha512(CryptoJS.enc.Base64.parse(b64UrlToB64(b64u))),
        'sha3': b64u => bytesToSha3(CryptoJS.enc.Base64.parse(b64UrlToB64(b64u))),
        'sha512-256': b64u => bytesToSha512_256(CryptoJS.enc.Base64.parse(b64UrlToB64(b64u))),
        'crc32': b64u => bytesToCrc32(CryptoJS.enc.Base64.parse(b64UrlToB64(b64u))),
    },
    'url': {
        'text': decodeURIComponent,
        'hex': url => textToHex(decodeURIComponent(url)),
        'base64': url => btoa(decodeURIComponent(url)),
        'base64url': url => b64ToB64Url(btoa(decodeURIComponent(url))),
        'morse': url => textToMorse(decodeURIComponent(url)),
        'bytes': url => new TextEncoder().encode(decodeURIComponent(url)).join(' '),
        'binary': url => bytesToBinary(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),

        'md5': url => bytesToMd5(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
        'sha1': url => bytesToSha1(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
        'sha256': url => bytesToSha256(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
        'sha512': url => bytesToSha512(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
        'sha3': url => bytesToSha3(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
        'sha512-256': url => bytesToSha512_256(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),

        'crc32': url => bytesToCrc32(CryptoJS.enc.Utf8.parse(decodeURIComponent(url))),
    },
    'morse': {
        'text': morseToText,
        'hex': morse => textToHex(morseToText(morse)),
        'base64': morse => btoa(morseToText(morse)),
        'url': morse => encodeURIComponent(morseToText(morse)),
        'base64url': morse => b64ToB64Url(btoa(morseToText(morse))),
        'bytes': morse => wordarrayToBytes(CryptoJS.enc.Utf8.parse(morseToText(morse))).join(' '),
        'binary': morse => bytesToBinary(CryptoJS.enc.Utf8.parse(morseToText(morse))),

        'md5': morse => bytesToMd5(CryptoJS.enc.Utf8.parse(morseToText(morse))),
        'sha1': morse => bytesToSha1(CryptoJS.enc.Utf8.parse(morseToText(morse))),
        'sha256': morse => bytesToSha256(CryptoJS.enc.Utf8.parse(morseToText(morse))),
        'sha512': morse => bytesToSha512(CryptoJS.enc.Utf8.parse(morseToText(morse))),
        'sha3': morse => bytesToSha3(CryptoJS.enc.Utf8.parse(morseToText(morse))),
        'sha512-256': morse => bytesToSha512_256(CryptoJS.enc.Utf8.parse(morseToText(morse))),

        'crc32': morse => bytesToCrc32(CryptoJS.enc.Utf8.parse(morseToText(morse))),
    },

    'bytes': {
        'text': btext => new TextDecoder().decode(btextToBytes(btext)),
        'hex': btext => btextToBytes(btext).toHex(),
        'base64': btext => btoa(new TextDecoder().decode(btextToBytes(btext))),
        'url': btext => encodeURIComponent(new TextDecoder().decode(btextToBytes(btext))),
        'base64url': btext => b64ToB64Url(btoa(new TextDecoder().decode(btextToBytes(btext)))),
        'morse': btext => textToMorse(new TextDecoder().decode(btextToBytes(btext))),
        'bytes': btext => btext,
        'binary': btext => bytesToBinary(btextToBytes(btext)),

        'md5': btext => bytesToMd5(btextToBytes(btext)),
        'sha1': btext => bytesToSha1(btextToBytes(btext)),
        'sha256': btext => bytesToSha256(btextToBytes(btext)),
        'sha512': btext => bytesToSha512(btextToBytes(btext)),
        'sha3': btext => bytesToSha3(btextToBytes(btext)),
        'sha512-256': btext => bytesToSha512_256(btextToBytes(btext)),

        'crc32': btext => bytesToCrc32(btextToBytes(btext)),
    },
    'binary': {
        'text': binary => new TextDecoder().decode(binaryToBytes(binary)),
        'hex': binary => textToHex(new TextDecoder().decode(binaryToBytes(binary))),
        'base64': binary => btoa(new TextDecoder().decode(binaryToBytes(binary))),
        'url': binary => encodeURIComponent(new TextDecoder().decode(binaryToBytes(binary))),
        'base64url': binary => b64ToB64Url(btoa(new TextDecoder().decode(binaryToBytes(binary)))),
        'morse': binary => textToMorse(new TextDecoder().decode(binaryToBytes(binary))),
        'bytes': binary => binaryToBytes(binary).join(' '),
        'binary': binary => binary,

        'md5': binary => bytesToMd5(binaryToBytes(binary)),
        'sha1': binary => bytesToSha1(binaryToBytes(binary)),
        'sha256': binary => bytesToSha256(binaryToBytes(binary)),
        'sha512': binary => bytesToSha512(binaryToBytes(binary)),
        'sha3': binary => bytesToSha3(binaryToBytes(binary)),
        'sha512-256': binary => bytesToSha512_256(binaryToBytes(binary)),

        'crc32': binary => bytesToCrc32(binaryToBytes(binary)),
    }
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
