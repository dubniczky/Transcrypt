import { expect } from 'vitest'
import { OptionError } from '../src/converters.js'
import { fromFormats, toFormats, OptionsResolver } from '../src/formats.js'

// Converts like the UI does: input format -> bytes -> output format. Options not given use their defaults.
export function convert(from, to, input, fromOptions = {}, toOptions = {}) {
    const bytes = fromFormats[from].convert(input, OptionsResolver.resolve(fromFormats[from], fromOptions))
    return toFormats[to].convert(bytes, OptionsResolver.resolve(toFormats[to], toOptions))
}

export function isValid(from, input, options = {}) {
    return fromFormats[from].validator(input, OptionsResolver.resolve(fromFormats[from], options))
}

// Expects `action` (sync or async) to fail with an OptionError for the given option field
export async function expectOptionError(action, optionId) {
    let error
    try {
        await action()
    } catch (e) {
        error = e
    }
    expect(error, 'expected an OptionError').toBeInstanceOf(OptionError)
    expect(error.optionId).toBe(optionId)
}
