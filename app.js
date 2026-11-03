// Set defaults
const defaultInputFormat = 'utf8'
const defaultOutputFormat = 'hex'


const fromFormats = {
    'utf8': {
        'name': 'Text (UTF-8)',
        'validator': input => true,
        'convert': input => new TextEncoder().encode(input)
    },
    'utf16le': {
        'name': 'Text (UTF-16LE)',
        'validator': input => true,
        'convert': input => utf16leToBytes(input)
    },
    'hex': {
        'name': 'Hex',
        'validator': input => {
            try {
                hexToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => hexToBytes(input)
    },
    'octal': {
        'name': 'Octal',
        'validator': input => {
            try {
                octalToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => octalToBytes(input)
    },
    'base32': {
        'name': 'Base32',
        'validator': input => {
            try {
                base32ToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => base32ToBytes(input)
    },
    'base64': {
        'name': 'Base64',
        'validator': input => {
            try {
                atob(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => base64ToBytes(input)
    },
    'base64url': {
        'name': 'Base64 URL',
        'validator': input => {
            try {
                atob(b64UrlToB64(input))
                return true
            } catch {
                return false
            }
        },
        'convert': input => base64ToBytes(b64UrlToB64(input))
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
        },
        'convert': input => new TextEncoder().encode(decodeURIComponent(input))
    },
    'bytes': {
        'name': 'Byte Array',
        'validator': input => {
            input = input.trim()
            if (input === '') {
                return true
            }
            return input.split(/\s+/).every(b => /^\d{1,3}$/.test(b) && parseInt(b, 10) <= 255)
        },
        'convert': input => btextToBytes(input)
    },
    'decimal': {
        'name': 'Decimal',
        'validator': input => {
            try {
                decimalToBytes(input)
                return true
            }
            catch {
                return false
            }
        },
        'convert': input => decimalToBytes(input)
    },
    'ascii85': {
        'name': 'ASCII 85',
        'validator': input => {
            try {
                ascii85ToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => ascii85ToBytes(input)
    },
    'htmlentities': {
        'name': 'HTML Entities',
        'validator': input => true, // It can be any text
        'convert': input => htmlentitiesToBytes(input)
    },
    'binary': {
        'name': 'Binary',
        'validator': input => /^[01\s]*$/.test(input),
        'convert': input => binaryToBytes(input)
    },
    'morse': {
        'name': 'Morse Code',
        'validator': input => /^[\s.\-\/]*$/.test(input), // '/' separates words
        'convert': input => new TextEncoder().encode(morseToText(input))
    },
    'uuid4': {
        'name': 'UUIDv4',
        'validator': input => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            return uuidRegex.test(input)
        },
        'convert': input => hexToBytes(input.replace(/-/g, ''))
    },
    'hexdump': {
        'name': 'Hex Dump',
        'validator': input => {
            try {
                hexdumpToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => hexdumpToBytes(input)
    },
    'ipv4': {
        'name': 'IPv4 Address',
        'validator': input => {
            try {
                ipv4ToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => ipv4ToBytes(input)
    },
    'ipv6': {
        'name': 'IPv6 Address',
        'validator': input => {
            try {
                ipv6ToBytes(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => ipv6ToBytes(input)
    },
    'iso8601': {
        'name': 'ISO 8601 Timestamp',
        'validator': input => {
            try {
                iso8601ToBytes(input)
                return true
            }
            catch {
                return false
            }
        },
        'convert': input => iso8601ToBytes(input)
    },
    'rot13': {
        'name': 'ROT13',
        'validator': input => true, // It can be any text
        'convert': input => rot13ToBytes(input)
    },
    'reverse': {
        'name': 'Reverse Text',
        'validator': input => true, // It can be any text
        'convert': input => new TextEncoder().encode(Array.from(input).reverse().join('')) // Array.from keeps emoji (surrogate pairs) intact
    },
    'jwt': {
        'name': 'JWT (decode)',
        'validator': input => {
            if (input.trim() === '') {
                return true
            }
            try {
                decodeJwt(input)
                return true
            } catch {
                return false
            }
        },
        'convert': input => input.trim() === '' ? new Uint8Array(0) : jwtToBytes(input)
    }
}


const toFormats = {
    'utf8': {
        'name': 'Text (UTF-8)',
        'convert': input => new TextDecoder().decode(input)
    },
    'utf16le': {
        'name': 'Text (UTF-16LE)',
        'convert': input => bytesToUtf16le(input)
    },
    'hex': {
        'name': 'Hex',
        'convert': input => bytesToHex(input)
    },
    'octal': {
        'name': 'Octal',
        'convert': input => bytesToOctal(input)
    },
    'base32': {
        'name': 'Base32',
        'convert': input => bytesToBase32(input)
    },
    'base64': {
        'name': 'Base64',
        'caseSensitive': true,
        'convert': input => bytesToBase64(input)
    },
    'url': {
        'name': 'URL Encoding',
        'convert': input => encodeURIComponent(new TextDecoder().decode(input))
    },
    'base64url': {
        'name': 'Base64 URL',
        'caseSensitive': true,
        'convert': input => b64ToB64Url(bytesToBase64(input))
    },
    'bytes': {
        'name': 'Byte Array',
        'convert': input => bytesToBtext(input)
    },
    'binary': {
        'name': 'Binary',
        'convert': input => bytesToBinary(input)
    },
    'decimal': {
        'name': 'Decimal',
        'convert': input => bytesToDecimal(input)
    },
    'ascii85': {
        'name': 'ASCII 85',
        'caseSensitive': true,
        'convert': input => bytesToAscii85(input)
    },
    'htmlentities': {
        'name': 'HTML Entities',
        'convert': input => bytesToHtmlentities(input)
    },
    'morse': {
        'name': 'Morse Code',
        'convert': input => textToMorse(new TextDecoder().decode(input))
    },
    'uuid4': {
        'name': 'UUIDv4',
        'convert': input => {
            if (input.length !== 16) {
                return 'Invalid UUIDv4 length! 16 bytes required. Current: ' + input.length
            }
          
            input[6] = (input[6] & 0x0f) | 0x40 // Set version (UUIDv4 = 0100)
            input[8] = (input[8] & 0x3f) | 0x80 // Set variant (10xx)
          
            // Convert bytes to UUID string format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            const hex = [...input].map(b => b.toString(16).padStart(2, '0'))
            return [
                hex.slice(0, 4).join(''),
                hex.slice(4, 6).join(''),
                hex.slice(6, 8).join(''),
                hex.slice(8, 10).join(''),
                hex.slice(10, 16).join('')
            ].join('-')
        }
    },
    'hexdump': {
        'name': 'Hex Dump',
        'convert': input => bytesToHexDump(input)
    },
    'ipv4': {
        'name': 'IPv4 Address',
        'convert': input => bytesToIpv4(input)
    },
    'ipv6': {
        'name': 'IPv6 Address',
        'convert': input => bytesToIpv6(input)
    },
    'iso8601': {
        'name': 'ISO 8601 Timestamp',
        'convert': input => bytesToIso8601(input)
    },

    // Hashes
    'md5': {
        'name': 'MD5 Hash',
        'convert': input => bytesToMd5(input),
    },
    'sha1': {
        'name': 'SHA1 Hash',
        'convert': input => bytesToSha1(input),
    },
    'sha256': {
        'name': 'SHA256 Hash',
        'convert': input => bytesToSha256(input),
    },
    'sha512': {
        'name': 'SHA512 Hash',
        'convert': input => bytesToSha512(input),
    },
    'pbkdf2': {
        'name': 'PBKDF2 Hash',
        'caseSensitive': true,
        'convert': input => bytesToPbkdf2(input), // async
    },

    // Checksums
    'crc32': {
        'name': 'CRC32 Checksum',
        'convert': input => bytesToCrc32(input),
    },

    // Misc
    'words': {
        'name': 'Word Count',
        'convert': input => {
            const text = new TextDecoder().decode(input)
            const words = text.match(/\w+/g) || [] // Counting whitespaces is not enough for word count.
            return words.length.toString()
        },
    },
    'rot13': {
        'name': 'ROT13',
        'convert': input => bytesToRot13(input)
    },
    'reverse': {
        'name': 'Reverse text',
        'convert': input => {
            const text = new TextDecoder().decode(input)
            return Array.from(text).reverse().join('')
        }
    },
}
console.log(`Loaded formats from configuration: input=${Object.keys(fromFormats).length}, output=${Object.keys(toFormats).length}.`)



// Load controls
const fromFormatSelector = document.getElementById("from-format")
const toFormatSelector = document.getElementById("to-format")
const inputText = document.getElementById("input-text")
const outputText = document.getElementById("output-text")
const convertButton = document.getElementById("convert-button")
const switchButton = document.getElementById("switch-button")
const copyButton = document.getElementById("copy-button")
const moveButton = document.getElementById("move-button")
const inputSizeLabel = document.getElementById("input-size")
const outputSizeLabel = document.getElementById("output-size")
const ignoreLineBreaksCheckbox = document.getElementById("ignore-line-breaks")
const casingSelector = document.getElementById("casing-selector")
const casingOptions = document.querySelectorAll(".casing-option")
const darkModeToggle = document.getElementById("dark-mode-toggle")
const outputPlaceholder = outputText.placeholder
console.log("Loaded controls.")


// Check for saved preference in localStorage for dark mode
if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode")
    darkModeToggle.checked = true
}

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
    console.log(`query_load input=${inputFormat}`)
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
    console.log(`query_load output=${outputFormat}`)
}
else {
    toFormatSelector.value = defaultOutputFormat
}

// Update query params to reflect defaults if not set
updateQueryParams(fromFormatSelector.value, toFormatSelector.value)
console.log(`Updated query parameters to reflect defaults if not set.`)



// Add event listeners
fromFormatSelector.addEventListener("change", function() {
    console.log("From format changed to " + fromFormatSelector.value)
    if (fromFormatSelector.value === 'jwt') {
        toFormatSelector.value = 'utf8' // The decoded JWT is JSON text, so show it as text by default
    }
    updateQueryParams(fromFormatSelector.value, toFormatSelector.value)
    convertEvent()
})
toFormatSelector.addEventListener("change", function() {
    console.log("To format changed to " + toFormatSelector.value)
    updateQueryParams(fromFormatSelector.value, toFormatSelector.value)
    convertEvent()
})
inputText.addEventListener("input", function() {
    convertEvent() // Validates the input as well
})
convertButton.addEventListener("click", function() {
    console.log("Convert button clicked")
    convertEvent()
})
switchButton.addEventListener("click", function() {
    console.log("Switch button clicked")
    const fromFormat = fromFormatSelector.value
    const toFormat = toFormatSelector.value
    if (!isSwapPossible(fromFormat, toFormat)) {
        return
    }
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
        if (casingSelector.classList.contains("disabled")) {
            return // Casing is not applicable to the selected output format
        }
        casingOptions.forEach(opt => opt.classList.remove("active"))
        option.classList.add("active")
        convertEvent()
    })
})
darkModeToggle.addEventListener("change", () => {
    if (darkModeToggle.checked) {
        document.body.classList.add("dark-mode")
        localStorage.setItem("darkMode", "enabled") // Save preference
    } else {
        document.body.classList.remove("dark-mode")
        localStorage.setItem("darkMode", "disabled") // Save preference
    }
})
console.log("Attached event listeners.")


// Functions
function updateQueryParams(from, to) {
    const url = new URL(window.location.href)
    url.searchParams.set('from', from)
    url.searchParams.set('to', to)
    window.history.replaceState({}, '', url)
}

function validateInput(format, input) {
    if (format in fromFormats) {
        return fromFormats[format].validator(input)
    }
    return false
}

// Validates the preprocessed input (e.g. with line breaks removed), which is what actually gets converted
function updateInputValidation(input) {
    const isValid = validateInput(fromFormatSelector.value, input)
    if (isValid) {
        inputText.classList.remove("is-invalid")
        return true
    } else {
        inputText.classList.add("is-invalid")
        updateOutput("")
        return false
    }
}

function updateOutputSizeLabel(size) {
    outputSizeLabel.innerText = `[${size}]`
}

function updateInputSizeLabel(size) {
    inputSizeLabel.innerText = `[${size}]`
}

function updateOutput(output) {
    updateOutputSizeLabel(output.length)
    outputText.value = output
}

function postprocessOutput(output, toFormat) {
    return applyCasingSetting(output, toFormat)
}

function isCasingApplicable(toFormat) {
    return !(toFormat in toFormats && toFormats[toFormat].caseSensitive)
}

function updateCasingAvailability() {
    const applicable = isCasingApplicable(toFormatSelector.value)
    casingSelector.classList.toggle("disabled", !applicable)
    casingSelector.title = applicable ? "" : "Casing is disabled because this output format is case-sensitive."
}

// Swapping only makes sense if the input format can also be an output and vice versa
// (e.g. hashes such as SHA256 are output-only, so they cannot become the input format)
function isSwapPossible(fromFormat, toFormat) {
    return fromFormat in toFormats && toFormat in fromFormats
}

function updateSwapAvailability() {
    const fromFormat = fromFormatSelector.value
    const toFormat = toFormatSelector.value
    const possible = isSwapPossible(fromFormat, toFormat)
    switchButton.disabled = !possible
    if (possible) {
        switchButton.title = "Swap the input and output formats."
    } else {
        const oneSided = !(toFormat in fromFormats)
            ? `${toFormats[toFormat]?.name ?? toFormat} can only be used as an output format`
            : `${fromFormats[fromFormat]?.name ?? fromFormat} can only be used as an input format`
        switchButton.title = `Cannot swap: ${oneSided}.`
    }
}

function applyCasingSetting(output, toFormat) {
    if (!isCasingApplicable(toFormat)) {
        return output // Changing the case would corrupt case-sensitive encodings such as Base64
    }
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

// Incremented on every conversion so that a slow async result (e.g. PBKDF2) cannot overwrite a newer one
let conversionCounter = 0

async function convertEvent() {
    const conversionId = ++conversionCounter
    const fromFormat = fromFormatSelector.value
    const toFormat = toFormatSelector.value
    const input = preprocessInput(inputText.value) // Preprocess input
    outputText.placeholder = outputPlaceholder
    updateCasingAvailability()
    updateSwapAvailability()

    if (!updateInputValidation(input)) {
        return
    }

    if (!(fromFormat in fromFormats)) {
        console.error(`Invalid input format selected ${fromFormat}`)
        return
    }

    if (!(toFormat in toFormats)) {
        console.error(`Invalid output format selected ${toFormat}`)
        return
    }

    
    const inputBytes = fromFormats[fromFormat].convert(input) // Convert input to bytes
    updateInputSizeLabel(inputBytes.length)
    let convertedOutput = toFormats[toFormat].convert(inputBytes) // Convert bytes to output format
    if (convertedOutput instanceof Promise) {
        updateOutput("")
        outputText.placeholder = "Computing..."
        convertedOutput = await convertedOutput
        if (conversionId !== conversionCounter) {
            return // A newer conversion has started in the meantime
        }
        outputText.placeholder = outputPlaceholder
    }

    const processedOutput = postprocessOutput(convertedOutput, toFormat)

    updateOutput(processedOutput)
}

// Do a conversion on load in case the user has a value in the input field and they are just refreshing the page
convertEvent()
console.log("Conversion on load complete.")
console.log("DONE.")