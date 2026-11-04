import { describe, it, expect } from 'vitest'
import { bytesToHex, b64ToB64Url, hexToBytes } from '../src/converters.js'
import { convert, isValid, expectOptionError } from './helpers.js'

// Case tables: [from, to, input, expected, fromOptions?, toOptions?]
function conversionCases(cases) {
    it.each(cases)('%s → %s: %j', (from, to, input, expected, fromOptions = {}, toOptions = {}) => {
        expect(convert(from, to, input, fromOptions, toOptions)).toBe(expected)
    })
}

// Validator tables: [format, input, expectedValidity, options?]
function validatorCases(cases) {
    it.each(cases)('%s validator: %j → %s', (format, input, expected, options = {}) => {
        expect(isValid(format, input, options)).toBe(expected)
    })
}

// Option error tables: [from, to, input, fromOptions, toOptions, optionId]
function optionErrorCases(cases) {
    it.each(cases)('%s → %s with %j %j rejects option "%s"', async (from, to, input, fromOptions, toOptions, optionId) => {
        await expectOptionError(() => convert(from, to, input, fromOptions, toOptions), optionId)
    })
}

const aText = 'the little fox JUMPS!!'
const fox = 'The quick brown fox jumps over the lazy dog'


describe('text encodings', () => {
    conversionCases([
        ['utf8', 'hex', aText, '746865206c6974746c6520666f78204a554d50532121'],
        ['hex', 'utf8', '746865206c6974746c6520666f78204a554d50532121', aText],
        ['utf8', 'base64', aText, 'dGhlIGxpdHRsZSBmb3ggSlVNUFMhIQ=='],
        ['base64', 'utf8', 'dGhlIGxpdHRsZSBmb3ggSlVNUFMhIQ==', aText],
        ['utf8', 'url', aText, 'the%20little%20fox%20JUMPS!!'],
        ['url', 'utf8', 'the%20little%20fox%20JUMPS!!', aText],
        ['utf8', 'base64url', aText, 'dGhlIGxpdHRsZSBmb3ggSlVNUFMhIQ'],
        ['base64url', 'utf8', 'dGhlIGxpdHRsZSBmb3ggSlVNUFMhIQ', aText],
        ['utf8', 'bytes', aText, '116 104 101 32 108 105 116 116 108 101 32 102 111 120 32 74 85 77 80 83 33 33'],
        ['bytes', 'utf8', '116 104 101 32 108 105 116 116 108 101 32 102 111 120 32 74 85 77 80 83 33 33', aText],
    ])
})

describe('hashes', () => {
    conversionCases([
        ['utf8', 'md5', aText, '05095ee87414b4fef7ce0081d0bd486e'],
        ['utf8', 'sha1', aText, 'd7db4f7dc228ea69e21188133d68972079681749'],
        ['utf8', 'sha256', aText, 'e5812f707cdbf9c840a316996c77af90ed046304cda0b44619ba98a3ffc0da73'],
        ['utf8', 'sha512', aText, 'bf0dda7b4b27864ec0ed536c932d92bc4eb21480d576c2cc81d85423fe495650180d45a9e37e366fe6eb1d9d12787a44da531457efb2c5a1ccf20ee50afdc1d1'],
    ])
})

describe('CRC32 (reference values from Python zlib.crc32)', () => {
    conversionCases([
        ['utf8', 'crc32', 'hello', '3610a686'],
        ['utf8', 'crc32', aText, 'eb76d5e5'],
        ['utf8', 'crc32', '', '00000000'],
    ])
})

describe('ASCII85 (reference values from Python base64.a85encode)', () => {
    conversionCases([
        ['utf8', 'ascii85', 'Man ', '9jqo^'],
        ['hex', 'ascii85', 'ffffffff', 's8W-!'],
        ['hex', 'ascii85', 'ff', 'rr'],
        ['hex', 'ascii85', 'deadbeef01', 'hQ=N\\!<'],
        ['hex', 'ascii85', '00000000', 'z'],
        ['ascii85', 'hex', 's8W-!', 'ffffffff'],
        ['ascii85', 'hex', 'hQ=N\\!<', 'deadbeef01'],
        ['ascii85', 'hex', '<~z~>', '00000000'],
        ['ascii85', 'utf8', '9jqo^', 'Man '],
    ])
    validatorCases([
        ['ascii85', 's8W-"', false], // overflow
        ['ascii85', 'abcdef', false], // dangling character
    ])
})

describe('decimal', () => {
    conversionCases([
        ['decimal', 'hex', '10', '0a'],
        ['decimal', 'hex', '256', '0100'],
        ['decimal', 'hex', '0', '00'],
        ['decimal', 'hex', '', ''],
        ['hex', 'decimal', '0100', '256'],
        ['hex', 'decimal', '', ''],
        // Byte order option
        ['hex', 'decimal', '0100', '1', {}, { byteOrder: 'little' }],
        ['decimal', 'hex', '256', '0001', { byteOrder: 'little' }],
        ['decimal', 'decimal', '258', '258', { byteOrder: 'little' }, { byteOrder: 'little' }],
    ])
    validatorCases([
        ['decimal', '12a', false],
    ])
})

describe('hex dump', () => {
    const dumpText = 'the fox ate a cab | abc |'
    it('round-trips its own format, including "|" characters in the ASCII column', () => {
        expect(convert('hexdump', 'utf8', convert('utf8', 'hexdump', dumpText))).toBe(dumpText)
    })
    conversionCases([
        ['hexdump', 'hex', '00000000: 6865 6c6c 6f0a                           hello.', '68656c6c6f0a'], // xxd
        ['hexdump', 'hex', '00000000  68 65 6c 6c 6f 20 77 6f  72 6c 64 0a  |hello world.|\n0000000c', '68656c6c6f20776f726c640a'], // hexdump -C
        // Options
        ['utf8', 'hexdump', 'abcdef', '00000000  61 62 63 64  abcd\n00000004  65 66        ef', {}, { bytesPerLine: 4 }],
        ['utf8', 'hexdump', 'abcdef', '00000000  61 62 63 64\n00000004  65 66', {}, { bytesPerLine: 4, ascii: false }],
        ['hexdump', 'utf8', '00000000  61 62 63 64\n00000004  65 66', 'abcdef'],
    ])
    validatorCases([
        ['hexdump', '00000000  zz', false],
    ])
    optionErrorCases([
        ['utf8', 'hexdump', 'abc', {}, { bytesPerLine: 0 }, 'bytesPerLine'],
    ])
})

describe('reverse', () => {
    conversionCases([
        ['reverse', 'utf8', 'a😀b', 'b😀a'], // emoji stay intact
        ['utf8', 'reverse', 'a😀b', 'b😀a'],
        ['utf8', 'reverse', 'hello big  world', 'world  big hello', {}, { by: 'words' }],
        ['utf8', 'reverse', 'one\ntwo\nthree', 'three\ntwo\none', {}, { by: 'lines' }],
        ['reverse', 'utf8', 'a\r\nb', 'b\r\na', { by: 'lines' }],
    ])
})

describe('morse', () => {
    conversionCases([
        ['utf8', 'morse', 'hi you', '.... .. / -.-- --- ..-'],
        ['morse', 'utf8', '.... .. / -.-- --- ..-', 'HI YOU'],
    ])
    validatorCases([
        ['morse', '.... .. / -.-- --- ..-', true],
    ])
})

describe('input validators', () => {
    validatorCases([
        ['hex', 'zz', false],
        ['hex', 'abc', false],
        ['hex', 'DEADbeef', true],
        ['octal', '777', false],
        ['octal', '377', true],
        ['base32', 'AB1', false],
        ['base32', 'MFRGG===', true],
        ['bytes', '', true],
        ['bytes', '1 2 256', false],
        ['bytes', '12abc', false],
        ['bytes', '[1, 2, 256]', false],
        ['binary', '', true],
        ['ipv4', '1x.2.3.4', false],
        ['ipv4', '1.2.3', false],
        ['ipv4', '192.168.0.1', true],
        ['ipv6', '1::2::3', false],
        ['ipv6', '1:2', false],
        ['ipv6', '1:2:3:4:5:6:7:8:9', false],
        ['ipv6', '::1', true],
        ['ipv6', '2001:db8::1', true],
    ])
})

describe('IPv6', () => {
    conversionCases([
        ['ipv6', 'hex', '2001:db8::1', '20010db8000000000000000000000001'],
        ['hex', 'ipv6', '20010db8000000000000000000000001', '2001:db8::1'],
        ['ipv6', 'ipv6', '2001:db8::1', '2001:0db8:0000:0000:0000:0000:0000:0001', {}, { compress: false }],
        ['ipv6', 'ipv6', '2001:0db8:0000:0000:0000:0000:0000:0001', '2001:db8::1'],
    ])
})

describe('JWT decoding', () => {
    // jwt.io example token
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const jwtExpected = JSON.stringify({
        header: { alg: 'HS256', typ: 'JWT' },
        payload: { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
        signature: 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        dates: { iat: '2018-01-18T01:30:22.000Z' },
    }, null, 2)
    const expiredJwt = 'eyJhbGciOiJub25lIn0.' + b64ToB64Url(btoa('{"exp":1000000000}')) + '.'

    conversionCases([
        ['jwt', 'utf8', jwt, jwtExpected],
        ['jwt', 'utf8', 'Bearer ' + jwt, jwtExpected],
        ['jwt', 'utf8', '', ''],
        // exp in the past is flagged as expired
        ['jwt', 'utf8', expiredJwt, JSON.stringify({
            header: { alg: 'none' }, payload: { exp: 1000000000 }, signature: '',
            dates: { exp: '2001-09-09T01:46:40.000Z (expired)' },
        }, null, 2)],
    ])
    validatorCases([
        ['jwt', jwt, true],
        ['jwt', jwt.split('.').slice(0, 2).join('.') + '.', true], // unsigned (alg: none)
        ['jwt', jwt.split('.').slice(0, 2).join('.'), false], // missing part
        ['jwt', 'abc.def.ghi', false], // not JSON
        ['jwt', 'a.b.c.d.e', false], // JWE
    ])
})

describe('Caesar / ROT (defaults = ROT13)', () => {
    conversionCases([
        ['utf8', 'rot13', 'Hello, World!', 'Uryyb, Jbeyq!'],
        ['rot13', 'utf8', 'Uryyb, Jbeyq!', 'Hello, World!'],
        ['utf8', 'rot13', 'Hello, World!', 'Khoor, Zruog!', {}, { shift: 3 }],
        ['rot13', 'utf8', 'Khoor, Zruog!', 'Hello, World!', { shift: 3 }],
        ['utf8', 'rot13', 'abc', 'zab', {}, { shift: -1 }],
        ['utf8', 'rot13', 'abc', 'bcd', {}, { shift: 27 }],
        ['utf8', 'rot13', '2024', '3135', {}, { shift: 1, alphabet: '0123456789' }],
        ['utf8', 'rot13', 'héllo', 'uéyyb'], // UTF-8 text is kept intact
        ['utf8', 'rot13', 'αβγ', 'βγα', {}, { shift: 1, alphabet: 'αβγ' }],
    ])
    optionErrorCases([
        ['utf8', 'rot13', 'abc', {}, { alphabet: '' }, 'alphabet'],
        ['utf8', 'rot13', 'abc', {}, { alphabet: 'aab' }, 'alphabet'],
        ['utf8', 'rot13', 'abc', {}, { shift: '1.5' }, 'shift'],
    ])
})

describe('HMAC (reference values from Python hmac)', () => {
    conversionCases([
        ['utf8', 'hmac', fox, '80070713463e7749b90c2dc24911e275', {}, { algorithm: 'MD5', key: 'key' }],
        ['utf8', 'hmac', fox, 'de7c9b85b8b78aa6bc8a7a36f70a90701c9db4d9', {}, { algorithm: 'SHA1', key: 'key' }],
        ['utf8', 'hmac', fox, 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8', {}, { key: 'key' }],
        ['utf8', 'hmac', fox, 'b42af09057bac1e2d41708e48a902e09b5ff7f12ab428a4fe86653c73dd248fb82f948a549f7b791a5b41915ee4d1ec3935357e4e2317250d0372afa2ebeeb3a', {}, { algorithm: 'SHA512', key: 'key' }],
        ['utf8', 'hmac', '', 'b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad'],
    ])
    optionErrorCases([
        ['utf8', 'hmac', 'abc', {}, { algorithm: 'SHA3' }, 'algorithm'],
    ])
})

describe('count', () => {
    const text = 'a😀 b\nc'
    conversionCases([
        ['utf8', 'words', text, '3'], // a, b, c (\w+ does not match emoji)
        ['utf8', 'words', text, '6', {}, { mode: 'characters' }],
        ['utf8', 'words', text, '2', {}, { mode: 'lines' }],
        ['utf8', 'words', text, '9', {}, { mode: 'bytes' }],
        ['utf8', 'words', '', '0', {}, { mode: 'lines' }],
    ])
})

describe('byte array', () => {
    conversionCases([
        ['hex', 'bytes', '010203', '1,2,3', {}, { separator: 'comma' }],
        ['hex', 'bytes', '010203', '[1, 2, 3]', {}, { separator: 'commaspace', brackets: true }],
        ['bytes', 'hex', '[1, 2,3]', '010203'],
        ['bytes', 'hex', '1,2,3', '010203'],
        ['bytes', 'hex', '[]', ''],
    ])
})

describe('Base64, Base64 URL and Base32 options', () => {
    const sixtyBytes = bytesToHex(Uint8Array.from({ length: 60 }, (_, i) => i))
    const wrapped = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4v\nMDEyMzQ1Njc4OTo7'
    conversionCases([
        ['utf8', 'base64', 'ab', 'YWI', {}, { padding: false }],
        ['hex', 'base64', sixtyBytes, wrapped, {}, { wrap: '64' }],
        ['base64', 'hex', wrapped, sixtyBytes],
        ['utf8', 'base64url', 'ab', 'YWI=', {}, { padding: true }],
        ['base64url', 'utf8', 'YWI=', 'ab'],
        ['utf8', 'base32', 'f', 'MY======'],
        ['utf8', 'base32', 'f', 'MY', {}, { padding: false }],
        ['base32', 'utf8', 'MY', 'f'],
    ])
    optionErrorCases([
        ['utf8', 'base64', 'a', {}, { wrap: '10' }, 'wrap'], // not one of the select choices
    ])
})

describe('UTF-16', () => {
    conversionCases([
        ['utf16le', 'hex', 'A😀', '41003dd800de'],
        ['utf16le', 'hex', 'A', '0041', { byteOrder: 'big' }],
        ['utf16le', 'hex', 'A', 'fffe4100', { bom: true }],
        ['utf16le', 'hex', 'A', 'feff0041', { byteOrder: 'big', bom: true }],
        ['hex', 'utf16le', '0041', 'A', {}, { byteOrder: 'big' }],
        ['hex', 'utf16le', 'feff0041', 'A', {}, { bom: true }], // BOM overrides little endian
        ['hex', 'utf16le', 'fffe4100', '﻿A'], // BOM kept as a character when not used
        ['utf16le', 'utf16le', 'A😀', 'A😀', { byteOrder: 'big', bom: true }, { bom: true }],
    ])
})

describe('PBKDF2 (asynchronous, WebCrypto)', () => {
    it('default output can be verified by recomputing the digest from the returned random salt', async () => {
        const result = await convert('utf8', 'pbkdf2', 'password', {}, { iterations: 1000 })
        const [prefix, hash, iterations, saltHex, digestHex] = result.split('$')
        expect([prefix, hash, iterations]).toEqual(['pbkdf2', 'sha256', '1000'])
        expect(saltHex).toMatch(/^[0-9a-f]{32}$/)

        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('password'), 'PBKDF2', false, ['deriveBits'])
        const expected = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations: 1000 }, key, 256)
        expect(digestHex).toBe(bytesToHex(new Uint8Array(expected)))
    })

    it('uses the default of 350000 iterations', async () => {
        const result = await convert('utf8', 'pbkdf2', 'x')
        expect(result.split('$').slice(0, 3)).toEqual(['pbkdf2', 'sha256', '350000'])
    })

    it('matches the RFC 6070 test vector (SHA-1, 1 iteration)', async () => {
        await expect(convert('utf8', 'pbkdf2', 'password', {},
            { hash: 'SHA-1', iterations: 1, keyLength: 160, salt: '73616c74', output: 'digest' }))
            .resolves.toBe('0c60c80f961f0e71f3a9b524af6012062fe037a6')
    })

    it('matches Python hashlib.pbkdf2_hmac (SHA-512, full output)', async () => {
        await expect(convert('utf8', 'pbkdf2', 'password', {},
            { hash: 'SHA-512', iterations: 2, keyLength: 512, salt: '73616c74' }))
            .resolves.toBe('pbkdf2$sha512$2$73616c74$e1d9c16aa681708a45f5c7c4e215ceb66e011a2e9f0040713f18aefdb866d53cf76cab2868a39b9f7840edce4fef5a82be67335c77a6068e04112754f27ccf4e')
    })

    it('rejects a salt that is not hex', async () => {
        await expectOptionError(() => convert('utf8', 'pbkdf2', 'x', {}, { salt: 'zz', iterations: 1 }), 'salt')
    })

    it('rejects a key length that is not a multiple of 8', async () => {
        await expectOptionError(() => convert('utf8', 'pbkdf2', 'x', {}, { keyLength: 12, iterations: 1 }), 'keyLength')
    })
})
