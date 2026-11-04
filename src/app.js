import {
    OptionError, utf16ToBytes, bytesToUtf16, hexToBytes, bytesToHex, octalToBytes, bytesToOctal,
    btextToBytes, bytesToBtext, base32ToBytes, bytesToBase32, htmlentitiesToBytes, bytesToHtmlentities,
    base64ToBytes, bytesToBase64, formatBase64, b64ToB64Url, b64UrlToB64, binaryToBytes, bytesToBinary,
    decimalToBytes, bytesToDecimal, bytesToHexDump, hexdumpToBytes, ipv4ToBytes, bytesToIpv4,
    ipv6ToBytes, bytesToIpv6, iso8601ToBytes, bytesToIso8601, ascii85ToBytes, bytesToAscii85,
    bytesToMd5, bytesToSha1, bytesToSha256, bytesToSha512, bytesToHmac, bytesToPbkdf2,
    caesarShift, countText, reverseText, textToMorse, morseToText, bytesToCrc32, decodeJwt, jwtToBytes,
} from './converters.js'

// Set defaults
const defaultInputFormat = 'utf8'
const defaultOutputFormat = 'hex'


// Format options
// Each format can declare `options`: fields that are rendered in the sidebar under its format selector.
// The resolved values are passed to `convert(input, options)` (and to the input `validator(input, options)`).
// Option fields:
//   id        key in the options object and in the URL query (e.g. ?to=hmac&to.algorithm=SHA1)
//   label     text shown in the sidebar
//   type      'number' | 'text' | 'select' | 'checkbox'
//   default   default value (select values are strings)
//   min, max, step   limits for numbers (integers only)
//   choices   [[value, label], ...] for selects
//   secret    never written to the URL (keys, salts)
//   title     tooltip
const caesarOptions = [
    { id: 'shift', label: 'Shift', type: 'number', default: 13, min: -1000000, max: 1000000,
      title: 'How many positions each character is moved forward in the alphabet. ROT13 is a shift of 13. As an input format the shift is reversed, so the same settings decode the text.' },
    { id: 'alphabet', label: 'Alphabet', type: 'text', default: 'abcdefghijklmnopqrstuvwxyz',
      title: 'The characters to rotate, in order. The other-case version of a letter is rotated too and keeps its case. Characters not in the alphabet are left unchanged.' },
]
const decimalOptions = [
    { id: 'byteOrder', label: 'Byte Order', type: 'select', default: 'big',
      choices: [['big', 'Big Endian'], ['little', 'Little Endian']],
      title: 'Big endian: the first byte is the most significant. Little endian: the first byte is the least significant.' },
]
const utf16ByteOrderOption = { id: 'byteOrder', label: 'Byte Order', type: 'select', default: 'little',
    choices: [['little', 'Little Endian (LE)'], ['big', 'Big Endian (BE)']] }
const reverseOptions = [
    { id: 'by', label: 'Reverse By', type: 'select', default: 'characters',
      choices: [['characters', 'Characters'], ['words', 'Words'], ['lines', 'Lines']] },
]

export class OptionsResolver {
    // Returns the full options object for a format: raw values (from the sidebar or the URL) merged with defaults.
    // Throws OptionError for invalid values.
    static resolve(format, raw = {}) {
        const resolved = {}
        for (const option of (format && format.options) || []) {
            const value = option.id in raw ? raw[option.id] : option.default
            resolved[option.id] = OptionsResolver.parse(option, value)
        }
        return resolved
    }

    static parse(option, value) {
        switch (option.type) {
            case 'checkbox':
                return value === true || value === 'true'
            case 'number': {
                const number = Number(String(value).trim())
                if (String(value).trim() === '' || !Number.isInteger(number)
                    || (option.min !== undefined && number < option.min)
                    || (option.max !== undefined && number > option.max)) {
                    throw new OptionError(option.id, `${option.label} must be a whole number between ${option.min} and ${option.max}`)
                }
                return number
            }
            case 'select': {
                const value_ = String(value)
                if (!option.choices.some(([choice]) => choice === value_)) {
                    throw new OptionError(option.id, `Invalid ${option.label}: ${value_}`)
                }
                return value_
            }
            default:
                return String(value)
        }
    }
}


export const fromFormats = {
    'utf8': {
        'name': 'Text (UTF-8)',
        'validator': input => true,
        'convert': input => new TextEncoder().encode(input)
    },
    'utf16le': {
        'name': 'Text (UTF-16)',
        'options': [
            utf16ByteOrderOption,
            { id: 'bom', label: 'Add Byte Order Mark (BOM)', type: 'checkbox', default: false },
        ],
        'validator': input => true,
        'convert': (input, o) => utf16ToBytes(input, o.byteOrder === 'little', o.bom)
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
            try {
                btextToBytes(input) // Accepts spaces, commas and [brackets]
                return true
            } catch {
                return false
            }
        },
        'convert': input => btextToBytes(input)
    },
    'decimal': {
        'name': 'Decimal',
        'options': decimalOptions,
        'validator': input => {
            try {
                decimalToBytes(input)
                return true
            }
            catch {
                return false
            }
        },
        'convert': (input, o) => decimalToBytes(input, o.byteOrder === 'little')
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
    'rot13': { // Key kept as 'rot13' so existing links keep working
        'name': 'Caesar / ROT',
        'options': caesarOptions,
        'validator': input => true, // It can be any text
        'convert': (input, o) => new TextEncoder().encode(caesarShift(input, -o.shift, o.alphabet)) // Decode: shift backwards
    },
    'reverse': {
        'name': 'Reverse Text',
        'options': reverseOptions,
        'validator': input => true, // It can be any text
        'convert': (input, o) => new TextEncoder().encode(reverseText(input, o.by))
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


export const toFormats = {
    'utf8': {
        'name': 'Text (UTF-8)',
        'convert': input => new TextDecoder().decode(input)
    },
    'utf16le': {
        'name': 'Text (UTF-16)',
        'options': [
            utf16ByteOrderOption,
            { id: 'bom', label: 'Use Byte Order Mark if present', type: 'checkbox', default: false,
              title: 'If the data starts with a byte order mark (FF FE or FE FF), use the byte order it specifies and remove it from the text.' },
        ],
        'convert': (input, o) => bytesToUtf16(input, o.byteOrder === 'little', o.bom)
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
        'options': [
            { id: 'padding', label: 'Padding (=)', type: 'checkbox', default: true },
        ],
        'convert': (input, o) => bytesToBase32(input, o.padding)
    },
    'base64': {
        'name': 'Base64',
        'caseSensitive': true,
        'options': [
            { id: 'padding', label: 'Padding (=)', type: 'checkbox', default: true },
            { id: 'wrap', label: 'Line Wrap', type: 'select', default: '0',
              choices: [['0', 'No wrapping'], ['64', '64 characters (PEM)'], ['76', '76 characters (MIME)']] },
        ],
        'convert': (input, o) => formatBase64(bytesToBase64(input), o.padding, Number(o.wrap))
    },
    'url': {
        'name': 'URL Encoding',
        'convert': input => encodeURIComponent(new TextDecoder().decode(input))
    },
    'base64url': {
        'name': 'Base64 URL',
        'caseSensitive': true,
        'options': [
            { id: 'padding', label: 'Padding (=)', type: 'checkbox', default: false },
        ],
        'convert': (input, o) => b64ToB64Url(bytesToBase64(input), o.padding)
    },
    'bytes': {
        'name': 'Byte Array',
        'options': [
            { id: 'separator', label: 'Separator', type: 'select', default: 'space',
              choices: [['space', 'Space'], ['comma', 'Comma (,)'], ['commaspace', 'Comma and space (, )']] },
            { id: 'brackets', label: 'Brackets [ ]', type: 'checkbox', default: false },
        ],
        'convert': (input, o) => bytesToBtext(input, o.separator, o.brackets)
    },
    'binary': {
        'name': 'Binary',
        'convert': input => bytesToBinary(input)
    },
    'decimal': {
        'name': 'Decimal',
        'options': decimalOptions,
        'convert': (input, o) => bytesToDecimal(input, o.byteOrder === 'little')
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
        'options': [
            { id: 'bytesPerLine', label: 'Bytes per Line', type: 'number', default: 16, min: 1, max: 64 },
            { id: 'ascii', label: 'Show ASCII Column', type: 'checkbox', default: true },
        ],
        'convert': (input, o) => bytesToHexDump(input, o.bytesPerLine, o.ascii)
    },
    'ipv4': {
        'name': 'IPv4 Address',
        'convert': input => bytesToIpv4(input)
    },
    'ipv6': {
        'name': 'IPv6 Address',
        'options': [
            { id: 'compress', label: 'Compress Zeros (::)', type: 'checkbox', default: true,
              title: 'Shorten the address by removing leading zeros and replacing the longest run of zero groups with ::' },
        ],
        'convert': (input, o) => bytesToIpv6(input, o.compress)
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
    'hmac': {
        'name': 'HMAC',
        'options': [
            { id: 'algorithm', label: 'Algorithm', type: 'select', default: 'SHA256',
              choices: [['MD5', 'HMAC-MD5'], ['SHA1', 'HMAC-SHA1'], ['SHA256', 'HMAC-SHA256'], ['SHA512', 'HMAC-SHA512']] },
            { id: 'key', label: 'Key', type: 'text', default: '', secret: true,
              title: 'The secret key, used as UTF-8 text. It is never stored in the URL.' },
        ],
        'convert': (input, o) => bytesToHmac(input, o.algorithm, o.key),
    },
    'pbkdf2': {
        'name': 'PBKDF2 Hash',
        'caseSensitive': true,
        'options': [
            { id: 'hash', label: 'Hash', type: 'select', default: 'SHA-256',
              choices: [['SHA-1', 'SHA-1'], ['SHA-256', 'SHA-256'], ['SHA-384', 'SHA-384'], ['SHA-512', 'SHA-512']] },
            { id: 'iterations', label: 'Iterations', type: 'number', default: 350000, min: 1, max: 10000000 },
            { id: 'keyLength', label: 'Key Length (bits)', type: 'number', default: 256, min: 8, max: 4096, step: 8 },
            { id: 'salt', label: 'Salt (hex)', type: 'text', default: '', secret: true, placeholder: 'random',
              title: 'Salt as a hex string. Leave empty to generate a random 16-byte salt. It is never stored in the URL.' },
            { id: 'output', label: 'Output', type: 'select', default: 'full',
              choices: [['full', 'Full (pbkdf2$...)'], ['digest', 'Digest only (hex)']],
              title: 'Full: pbkdf2$hash$iterations$salt$digest, which contains everything needed to verify the password. Digest only: just the derived key in hex.' },
        ],
        'convert': (input, o) => bytesToPbkdf2(input, o.hash, o.iterations, o.keyLength, o.salt, o.output), // async
    },

    // Checksums
    'crc32': {
        'name': 'CRC32 Checksum',
        'convert': input => bytesToCrc32(input),
    },

    // Misc
    'words': { // Key kept as 'words' so existing links keep working
        'name': 'Count',
        'options': [
            { id: 'mode', label: 'Count', type: 'select', default: 'words',
              choices: [['words', 'Words'], ['characters', 'Characters'], ['lines', 'Lines'], ['bytes', 'Bytes']] },
        ],
        'convert': (input, o) => countText(input, o.mode),
    },
    'rot13': { // Key kept as 'rot13' so existing links keep working
        'name': 'Caesar / ROT',
        'options': caesarOptions,
        'convert': (input, o) => caesarShift(new TextDecoder().decode(input), o.shift, o.alphabet)
    },
    'reverse': {
        'name': 'Reverse Text',
        'options': reverseOptions,
        'convert': (input, o) => reverseText(new TextDecoder().decode(input), o.by)
    },
}
console.log(`Loaded formats from configuration: input=${Object.keys(fromFormats).length}, output=${Object.keys(toFormats).length}.`)



// Load controls
const fromFormatSelector = document.getElementById("from-format")
const toFormatSelector = document.getElementById("to-format")
const fromOptionsContainer = document.getElementById("from-options")
const toOptionsContainer = document.getElementById("to-options")
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
const inputFormat = urlParams.get('from')
const outputFormat = urlParams.get('to')


// Add formats to the selector
for (const [key, value] of Object.entries(fromFormats)) {
    const option = document.createElement("option")
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
    const option = document.createElement("option")
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

// Render the option fields, using non-secret values from the URL (e.g. ?to.algorithm=SHA1)
renderFormatOptions('from', readOptionsFromUrl('from', urlParams))
renderFormatOptions('to', readOptionsFromUrl('to', urlParams))

// Update query params to reflect defaults if not set
updateQueryParams()
console.log(`Updated query parameters to reflect defaults if not set.`)



// Add event listeners
fromFormatSelector.addEventListener("change", function() {
    console.log("From format changed to " + fromFormatSelector.value)
    renderFormatOptions('from')
    if (fromFormatSelector.value === 'jwt') {
        toFormatSelector.value = 'utf8' // The decoded JWT is JSON text, so show it as text by default
        renderFormatOptions('to')
    }
    updateQueryParams()
    convertEvent()
})
toFormatSelector.addEventListener("change", function() {
    console.log("To format changed to " + toFormatSelector.value)
    renderFormatOptions('to')
    updateQueryParams()
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
    // Option values travel with their format to the other side (where the field exists there too)
    const fromValues = readOptionValues('from')
    const toValues = readOptionValues('to')
    fromFormatSelector.value = toFormat
    toFormatSelector.value = fromFormat
    renderFormatOptions('from', toValues)
    renderFormatOptions('to', fromValues)
    updateQueryParams()
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
function selectedFormat(side) {
    return side === 'from' ? fromFormats[fromFormatSelector.value] : toFormats[toFormatSelector.value]
}

function optionsContainer(side) {
    return side === 'from' ? fromOptionsContainer : toOptionsContainer
}

// Draws the option fields of the selected format under its selector. `values` overrides the defaults.
function renderFormatOptions(side, values = {}) {
    const container = optionsContainer(side)
    const options = (selectedFormat(side) && selectedFormat(side).options) || []
    container.replaceChildren()
    container.hidden = options.length === 0

    for (const option of options) {
        const fieldId = `${side}-opt-${option.id}`
        const value = option.id in values ? values[option.id] : option.default
        const wrapper = document.createElement('div')
        wrapper.className = 'format-option'
        if (option.title) {
            wrapper.title = option.title
        }

        const label = document.createElement('label')
        label.htmlFor = fieldId
        label.textContent = option.label

        let field
        if (option.type === 'checkbox') {
            wrapper.classList.add('form-check')
            field = document.createElement('input')
            field.type = 'checkbox'
            field.className = 'form-check-input'
            field.checked = value === true || value === 'true'
            label.className = 'form-check-label'
            wrapper.append(field, label)
        } else {
            label.className = 'form-label small mb-1'
            if (option.type === 'select') {
                field = document.createElement('select')
                field.className = 'form-select form-select-sm'
                for (const [choiceValue, choiceLabel] of option.choices) {
                    field.add(new Option(choiceLabel, choiceValue))
                }
            } else {
                field = document.createElement('input')
                field.type = option.type === 'number' ? 'number' : 'text'
                field.className = 'form-control form-control-sm'
                if (option.min !== undefined) field.min = option.min
                if (option.max !== undefined) field.max = option.max
                if (option.step !== undefined) field.step = option.step
                if (option.placeholder) field.placeholder = option.placeholder
                field.spellcheck = false
                field.autocomplete = 'off'
            }
            field.value = String(value)
            wrapper.append(label, field)
        }

        field.id = fieldId
        field.dataset.optionId = option.id
        field.addEventListener('input', () => {
            updateQueryParams()
            convertEvent()
        })
        container.appendChild(wrapper)
    }
}

// Raw values of the rendered option fields: { optionId: value }
function readOptionValues(side) {
    const values = {}
    for (const field of optionsContainer(side).querySelectorAll('[data-option-id]')) {
        values[field.dataset.optionId] = field.type === 'checkbox' ? field.checked : field.value
    }
    return values
}

function readOptionsFromUrl(side, params) {
    const values = {}
    const format = selectedFormat(side)
    for (const option of (format && format.options) || []) {
        const value = params.get(`${side}.${option.id}`)
        if (value !== null && !option.secret) {
            values[option.id] = value
        }
    }
    return values
}

function clearOptionErrors() {
    document.querySelectorAll('.format-options .is-invalid').forEach(field => {
        field.classList.remove('is-invalid')
        field.removeAttribute('title')
    })
}

function markOptionError(side, error) {
    const field = document.getElementById(`${side}-opt-${error.optionId}`)
    if (field) {
        field.classList.add('is-invalid')
        field.title = error.message
    }
}

function updateQueryParams() {
    const url = new URL(window.location.href)
    url.searchParams.set('from', fromFormatSelector.value)
    url.searchParams.set('to', toFormatSelector.value)

    // Store only the non-default, non-secret option values
    for (const key of [...url.searchParams.keys()]) {
        if (key.startsWith('from.') || key.startsWith('to.')) {
            url.searchParams.delete(key)
        }
    }
    for (const side of ['from', 'to']) {
        const values = readOptionValues(side)
        for (const option of selectedFormat(side)?.options || []) {
            if (!option.secret && option.id in values && String(values[option.id]) !== String(option.default)) {
                url.searchParams.set(`${side}.${option.id}`, values[option.id])
            }
        }
    }
    window.history.replaceState({}, '', url) // Replace instead of push, so format changes don't fill up the back button history
}

function validateInput(format, input, options) {
    if (format in fromFormats) {
        return fromFormats[format].validator(input, options)
    }
    return false
}

// Validates the preprocessed input (e.g. with line breaks removed), which is what actually gets converted
function updateInputValidation(input, options) {
    const isValid = validateInput(fromFormatSelector.value, input, options)
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

function showConversionError(message) {
    updateOutput("")
    outputText.placeholder = message
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
    clearOptionErrors()

    if (!(fromFormat in fromFormats)) {
        console.error(`Invalid input format selected ${fromFormat}`)
        return
    }

    if (!(toFormat in toFormats)) {
        console.error(`Invalid output format selected ${toFormat}`)
        return
    }

    // Read the sidebar option fields of both formats
    let fromOptions, toOptions
    let side = 'from'
    try {
        fromOptions = OptionsResolver.resolve(fromFormats[fromFormat], readOptionValues('from'))
        side = 'to'
        toOptions = OptionsResolver.resolve(toFormats[toFormat], readOptionValues('to'))
    } catch (error) {
        if (!(error instanceof OptionError)) throw error
        markOptionError(side, error)
        showConversionError(error.message)
        return
    }

    if (!updateInputValidation(input, fromOptions)) {
        return
    }

    let convertedOutput
    side = 'from'
    try {
        const inputBytes = fromFormats[fromFormat].convert(input, fromOptions) // Convert input to bytes
        updateInputSizeLabel(inputBytes.length)
        side = 'to'
        convertedOutput = toFormats[toFormat].convert(inputBytes, toOptions) // Convert bytes to output format
        if (convertedOutput instanceof Promise) {
            updateOutput("")
            outputText.placeholder = "Computing..."
            convertedOutput = await convertedOutput
        }
    } catch (error) {
        if (conversionId !== conversionCounter) {
            return // A newer conversion has started in the meantime
        }
        console.error(error)
        if (error instanceof OptionError) {
            markOptionError(side, error)
        }
        showConversionError(`Error: ${error.message}`)
        return
    }
    if (conversionId !== conversionCounter) {
        return // A newer conversion has started in the meantime
    }
    outputText.placeholder = outputPlaceholder

    const processedOutput = postprocessOutput(convertedOutput, toFormat)
    updateOutput(processedOutput)
}

// Do a conversion on load in case the user has a value in the input field and they are just refreshing the page
convertEvent()
console.log("Conversion on load complete.")
console.log("DONE.")
