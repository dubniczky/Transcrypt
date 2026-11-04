import { OptionError } from './converters.js'
import { fromFormats, toFormats, OptionsResolver } from './formats.js'
console.log(`Loaded formats from configuration: input=${Object.keys(fromFormats).length}, output=${Object.keys(toFormats).length}.`)

// Set defaults
const defaultInputFormat = 'utf8'
const defaultOutputFormat = 'hex'





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
