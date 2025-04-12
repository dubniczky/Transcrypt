fromFormatSelector = document.getElementById("from-format")
toFormatSelector = document.getElementById("to-format")
inputText = document.getElementById("input-text")
outputText = document.getElementById("output-text")
convertButton = document.getElementById("convert-button")
switchButton = document.getElementById("switch-button")
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
}

// Add formats to the selector
for (const [key, value] of Object.entries(fromFormats)) {
    option = document.createElement("option")
    option.value = key
    option.text = value.name
    fromFormatSelector.appendChild(option)
}
fromFormatSelector.value = 'text'
for (const [key, value] of Object.entries(toFormats)) {
    option = document.createElement("option")
    option.value = key
    option.text = value.name
    toFormatSelector.appendChild(option)
}
toFormatSelector.value = 'hex'

// Add event listeners
fromFormatSelector.addEventListener("change", function() {
    console.log("From format changed to " + fromFormatSelector.value)
    convertEvent()
})
toFormatSelector.addEventListener("change", function() {
    console.log("To format changed to " + toFormatSelector.value)
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
    convertEvent()
})

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
        outputText.value = ""
        return false
    }
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

    output = converters[fromFormat][toFormat](input)
    outputText.value = output
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
for (const [fromKey, fromValue] of Object.entries(fromFormats)) {
    for (const [toKey, toValue] of Object.entries(toFormats)) {
        if (fromKey == toKey) continue
        // Check if the converter exists
        if (!(fromKey in converters) || !(toKey in converters[fromKey])) {
            console.error(`Missing converter for ${fromKey} to ${toKey}`)
        }
    }
}