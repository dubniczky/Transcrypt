// @vitest-environment jsdom
// HTML entity decoding uses a detached <textarea>, so these tests need a DOM
import { describe, it, expect } from 'vitest'
import { convert } from './helpers.js'

describe('HTML entities', () => {
    it.each([
        ['&lt;&amp;&#x41;&#66;&gt;', '<&AB>'], // named, hex and decimal entities
        ['<b>not markup</b>', '<b>not markup</b>'], // tags stay text, nothing is parsed as HTML
    ])('decodes %j → %j', (input, expected) => {
        expect(convert('htmlentities', 'utf8', input)).toBe(expected)
    })
})
