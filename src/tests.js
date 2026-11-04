import { OptionError, hexToBytes, bytesToHex, b64ToB64Url } from './converters.js'
import { fromFormats, toFormats, OptionsResolver } from './app.js'

let testRunnerTotalErrors = 0

// Converts like the UI does: options not given use their defaults
function convertWithOptions(from, to, input, fromOptions = {}, toOptions = {}) {
    const bytes = fromFormats[from].convert(input, OptionsResolver.resolve(fromFormats[from], fromOptions))
    return toFormats[to].convert(bytes, OptionsResolver.resolve(toFormats[to], toOptions))
}

function assertEq(from, to, input, expected, fromOptions = {}, toOptions = {}) {
    let result
    try {
        result = convertWithOptions(from, to, input, fromOptions, toOptions)
    } catch (error) {
        result = `THROWS ${error.message}`
    }
    if (result == expected) {
        return true
    }
    console.error(`${from} -> ${to} ${JSON.stringify(fromOptions)} ${JSON.stringify(toOptions)}: "${result}" != "${expected}"`)
    testRunnerTotalErrors++
}

// Expects the conversion to fail with an OptionError for `optionId`
function assertOptionError(from, to, input, fromOptions, toOptions, optionId) {
    try {
        convertWithOptions(from, to, input, fromOptions, toOptions)
    } catch (error) {
        if (error instanceof OptionError && error.optionId === optionId) {
            return true
        }
        console.error(`${from} -> ${to}: expected OptionError(${optionId}), got ${error}`)
        testRunnerTotalErrors++
        return
    }
    console.error(`${from} -> ${to}: expected OptionError(${optionId}), but it succeeded`)
    testRunnerTotalErrors++
}

function assertValid(from, input, expected, options = {}) {
    const result = fromFormats[from]['validator'](input, OptionsResolver.resolve(fromFormats[from], options))
    if (result === expected) {
        return true
    }
    console.error(`${from} validator("${input}"): ${result} != ${expected}`)
    testRunnerTotalErrors++
}

async function assertAsyncEq(from, to, input, expected, fromOptions = {}, toOptions = {}) {
    const result = await convertWithOptions(from, to, input, fromOptions, toOptions)
    if (result === expected) {
        return true
    }
    console.error(`${from} -> ${to} ${JSON.stringify(toOptions)}: "${result}" != "${expected}"`)
    testRunnerTotalErrors++
}

async function assertPbkdf2(input) {
    const result = await convertWithOptions('utf8', 'pbkdf2', input)
    const [, hash, iterations, saltHex, digestHex] = result.split('$')
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(input), 'PBKDF2', false, ['deriveBits'])
    const expected = bytesToHex(new Uint8Array(await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations: Number(iterations) }, key, 256
    )))
    if (hash === 'sha256' && digestHex === expected) {
        return true
    }
    console.error(`pbkdf2 mismatch: ${result} (expected digest ${expected})`)
    testRunnerTotalErrors++
}

function runTests() {
    testRunnerTotalErrors = 0
    
    const bHex = '40d810e201413fe363b902d62f48ebce'
    const bB64 = 'QNgQ4gFBP+NjuQLWL0jrzg=='

    // Text
    const aText = 'the little fox JUMPS!!'
    assertEq('utf8', 'hex', aText, '746865206c6974746c6520666f78204a554d50532121')
    assertEq('hex', 'utf8', '746865206c6974746c6520666f78204a554d50532121', aText)
    assertEq('utf8', 'base64', aText, 'dGhlIGxpdHRsZSBmb3ggSlVNUFMhIQ==')
    assertEq('base64', 'utf8', 'dGhlIGxpdHRsZSBmb3ggSlVNUFMhIQ==', aText)
    assertEq('utf8', 'url', aText, 'the%20little%20fox%20JUMPS!!')
    assertEq('url', 'utf8', 'the%20little%20fox%20JUMPS!!', aText)
    assertEq('utf8', 'base64url', aText, 'dGhlIGxpdHRsZSBmb3ggSlVNUFMhIQ')
    assertEq('base64url', 'utf8', 'dGhlIGxpdHRsZSBmb3ggSlVNUFMhIQ', aText)
    assertEq('utf8', 'bytes', aText, '116 104 101 32 108 105 116 116 108 101 32 102 111 120 32 74 85 77 80 83 33 33')
    assertEq('bytes', 'utf8', '116 104 101 32 108 105 116 116 108 101 32 102 111 120 32 74 85 77 80 83 33 33', aText)

    assertEq('utf8', 'md5', aText, '05095ee87414b4fef7ce0081d0bd486e')
    assertEq('utf8', 'sha1', aText, 'd7db4f7dc228ea69e21188133d68972079681749')
    assertEq('utf8', 'sha256', aText, 'e5812f707cdbf9c840a316996c77af90ed046304cda0b44619ba98a3ffc0da73')
    assertEq('utf8', 'sha512', aText, 'bf0dda7b4b27864ec0ed536c932d92bc4eb21480d576c2cc81d85423fe495650180d45a9e37e366fe6eb1d9d12787a44da531457efb2c5a1ccf20ee50afdc1d1')

    // CRC32 (reference values from Python zlib.crc32)
    assertEq('utf8', 'crc32', 'hello', '3610a686')
    assertEq('utf8', 'crc32', aText, 'eb76d5e5')
    assertEq('utf8', 'crc32', '', '00000000')

    // ASCII85 (reference values from Python base64.a85encode)
    assertEq('utf8', 'ascii85', 'Man ', '9jqo^')
    assertEq('hex', 'ascii85', 'ffffffff', 's8W-!')
    assertEq('hex', 'ascii85', 'ff', 'rr')
    assertEq('hex', 'ascii85', 'deadbeef01', 'hQ=N\\!<')
    assertEq('hex', 'ascii85', '00000000', 'z')
    assertEq('ascii85', 'hex', 's8W-!', 'ffffffff')
    assertEq('ascii85', 'hex', 'hQ=N\\!<', 'deadbeef01')
    assertEq('ascii85', 'hex', '<~z~>', '00000000')
    assertEq('ascii85', 'utf8', '9jqo^', 'Man ')
    assertValid('ascii85', 's8W-"', false) // overflow
    assertValid('ascii85', 'abcdef', false) // dangling character

    // Decimal
    assertEq('decimal', 'hex', '10', '0a')
    assertEq('decimal', 'hex', '256', '0100')
    assertEq('decimal', 'hex', '0', '00')
    assertEq('decimal', 'hex', '', '')
    assertEq('hex', 'decimal', '0100', '256')
    assertEq('hex', 'decimal', '', '')
    assertValid('decimal', '12a', false)

    // Hex dump
    const dumpText = 'the fox ate a cab | abc |'
    assertEq('hexdump', 'utf8', convertWithOptions('utf8', 'hexdump', dumpText), dumpText)
    assertEq('hexdump', 'hex', '00000000: 6865 6c6c 6f0a                           hello.', '68656c6c6f0a') // xxd
    assertEq('hexdump', 'hex', '00000000  68 65 6c 6c 6f 20 77 6f  72 6c 64 0a  |hello world.|\n0000000c', '68656c6c6f20776f726c640a') // hexdump -C
    assertValid('hexdump', '00000000  zz', false)

    // Reverse text keeps emoji intact
    assertEq('reverse', 'utf8', 'a😀b', 'b😀a')
    assertEq('utf8', 'reverse', 'a😀b', 'b😀a')

    // HTML entities: named, decimal and hex
    assertEq('htmlentities', 'utf8', '&lt;&amp;&#x41;&#66;&gt;', '<&AB>')

    // Morse round trip with word separator
    assertEq('utf8', 'morse', 'hi you', '.... .. / -.-- --- ..-')
    assertEq('morse', 'utf8', '.... .. / -.-- --- ..-', 'HI YOU')
    assertValid('morse', '.... .. / -.-- --- ..-', true)

    // Validators
    assertValid('hex', 'zz', false)
    assertValid('hex', 'abc', false)
    assertValid('hex', 'DEADbeef', true)
    assertValid('octal', '777', false)
    assertValid('octal', '377', true)
    assertValid('base32', 'AB1', false)
    assertValid('base32', 'MFRGG===', true)
    assertValid('bytes', '', true)
    assertValid('bytes', '1 2 256', false)
    assertValid('bytes', '12abc', false)
    assertValid('binary', '', true)
    assertValid('ipv4', '1x.2.3.4', false)
    assertValid('ipv4', '1.2.3', false)
    assertValid('ipv4', '192.168.0.1', true)
    assertValid('ipv6', '1::2::3', false)
    assertValid('ipv6', '1:2', false)
    assertValid('ipv6', '1:2:3:4:5:6:7:8:9', false)
    assertValid('ipv6', '::1', true)
    assertValid('ipv6', '2001:db8::1', true)
    assertEq('ipv6', 'hex', '2001:db8::1', '20010db8000000000000000000000001')
    assertEq('hex', 'ipv6', '20010db8000000000000000000000001', '2001:db8::1')

    // JWT decoding (jwt.io example token)
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const jwtExpected = JSON.stringify({
        header: { alg: 'HS256', typ: 'JWT' },
        payload: { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
        signature: 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        dates: { iat: '2018-01-18T01:30:22.000Z' },
    }, null, 2)
    assertEq('jwt', 'utf8', jwt, jwtExpected)
    assertEq('jwt', 'utf8', 'Bearer ' + jwt, jwtExpected)
    assertEq('jwt', 'utf8', '', '')
    assertValid('jwt', jwt, true)
    assertValid('jwt', jwt.split('.').slice(0, 2).join('.') + '.', true) // unsigned (alg: none)
    assertValid('jwt', jwt.split('.').slice(0, 2).join('.'), false) // missing part
    assertValid('jwt', 'abc.def.ghi', false) // not JSON
    assertValid('jwt', 'a.b.c.d.e', false) // JWE
    // exp in the past is flagged as expired
    const expiredJwt = 'eyJhbGciOiJub25lIn0.' + b64ToB64Url(btoa('{"exp":1000000000}')) + '.'
    assertEq('jwt', 'utf8', expiredJwt, JSON.stringify({
        header: { alg: 'none' }, payload: { exp: 1000000000 }, signature: '',
        dates: { exp: '2001-09-09T01:46:40.000Z (expired)' },
    }, null, 2))

    // Format options

    // Caesar / ROT (defaults = ROT13)
    assertEq('utf8', 'rot13', 'Hello, World!', 'Uryyb, Jbeyq!')
    assertEq('rot13', 'utf8', 'Uryyb, Jbeyq!', 'Hello, World!')
    assertEq('utf8', 'rot13', 'Hello, World!', 'Khoor, Zruog!', {}, { shift: 3 })
    assertEq('rot13', 'utf8', 'Khoor, Zruog!', 'Hello, World!', { shift: 3 })
    assertEq('utf8', 'rot13', 'abc', 'zab', {}, { shift: -1 })
    assertEq('utf8', 'rot13', 'abc', 'bcd', {}, { shift: 27 })
    assertEq('utf8', 'rot13', '2024', '3135', {}, { shift: 1, alphabet: '0123456789' })
    assertEq('utf8', 'rot13', 'héllo', 'uéyyb') // UTF-8 text is kept intact
    assertEq('utf8', 'rot13', 'αβγ', 'βγα', {}, { shift: 1, alphabet: 'αβγ' })
    assertOptionError('utf8', 'rot13', 'abc', {}, { alphabet: '' }, 'alphabet')
    assertOptionError('utf8', 'rot13', 'abc', {}, { alphabet: 'aab' }, 'alphabet')
    assertOptionError('utf8', 'rot13', 'abc', {}, { shift: '1.5' }, 'shift')

    // HMAC (reference values from Python hmac)
    const fox = 'The quick brown fox jumps over the lazy dog'
    assertEq('utf8', 'hmac', fox, '80070713463e7749b90c2dc24911e275', {}, { algorithm: 'MD5', key: 'key' })
    assertEq('utf8', 'hmac', fox, 'de7c9b85b8b78aa6bc8a7a36f70a90701c9db4d9', {}, { algorithm: 'SHA1', key: 'key' })
    assertEq('utf8', 'hmac', fox, 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8', {}, { key: 'key' })
    assertEq('utf8', 'hmac', fox, 'b42af09057bac1e2d41708e48a902e09b5ff7f12ab428a4fe86653c73dd248fb82f948a549f7b791a5b41915ee4d1ec3935357e4e2317250d0372afa2ebeeb3a', {}, { algorithm: 'SHA512', key: 'key' })
    assertEq('utf8', 'hmac', '', 'b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad')
    assertOptionError('utf8', 'hmac', 'abc', {}, { algorithm: 'SHA3' }, 'algorithm')

    // Count
    const countText_ = 'a😀 b\nc'
    assertEq('utf8', 'words', countText_, '3') // a, b, c (\w+ does not match emoji)
    assertEq('utf8', 'words', countText_, '6', {}, { mode: 'characters' })
    assertEq('utf8', 'words', countText_, '2', {}, { mode: 'lines' })
    assertEq('utf8', 'words', countText_, '9', {}, { mode: 'bytes' })
    assertEq('utf8', 'words', '', '0', {}, { mode: 'lines' })

    // Byte Array
    assertEq('hex', 'bytes', '010203', '1,2,3', {}, { separator: 'comma' })
    assertEq('hex', 'bytes', '010203', '[1, 2, 3]', {}, { separator: 'commaspace', brackets: true })
    assertEq('bytes', 'hex', '[1, 2,3]', '010203')
    assertEq('bytes', 'hex', '1,2,3', '010203')
    assertEq('bytes', 'hex', '[]', '')
    assertValid('bytes', '[1, 2, 256]', false)

    // Base64, Base64 URL, Base32
    assertEq('utf8', 'base64', 'ab', 'YWI', {}, { padding: false })
    const sixtyBytes = bytesToHex(Uint8Array.from({ length: 60 }, (_, i) => i))
    assertEq('hex', 'base64', sixtyBytes, 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4v\nMDEyMzQ1Njc4OTo7', {}, { wrap: '64' })
    assertEq('base64', 'hex', 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4v\nMDEyMzQ1Njc4OTo7', sixtyBytes)
    assertEq('utf8', 'base64url', 'ab', 'YWI=', {}, { padding: true })
    assertEq('base64url', 'utf8', 'YWI=', 'ab')
    assertEq('utf8', 'base32', 'f', 'MY======')
    assertEq('utf8', 'base32', 'f', 'MY', {}, { padding: false })
    assertEq('base32', 'utf8', 'MY', 'f')

    // Decimal byte order
    assertEq('hex', 'decimal', '0100', '1', {}, { byteOrder: 'little' })
    assertEq('decimal', 'hex', '256', '0001', { byteOrder: 'little' })
    assertEq('decimal', 'decimal', '258', '258', { byteOrder: 'little' }, { byteOrder: 'little' })

    // UTF-16
    assertEq('utf16le', 'hex', 'A😀', '41003dd800de')
    assertEq('utf16le', 'hex', 'A', '0041', { byteOrder: 'big' })
    assertEq('utf16le', 'hex', 'A', 'fffe4100', { bom: true })
    assertEq('utf16le', 'hex', 'A', 'feff0041', { byteOrder: 'big', bom: true })
    assertEq('hex', 'utf16le', '0041', 'A', {}, { byteOrder: 'big' })
    assertEq('hex', 'utf16le', 'feff0041', 'A', {}, { bom: true }) // BOM overrides little endian
    assertEq('hex', 'utf16le', 'fffe4100', '﻿A') // BOM kept as a character when not used
    assertEq('utf16le', 'utf16le', 'A😀', 'A😀', { byteOrder: 'big', bom: true }, { bom: true })

    // Hex Dump
    assertEq('utf8', 'hexdump', 'abcdef', '00000000  61 62 63 64  abcd\n00000004  65 66        ef', {}, { bytesPerLine: 4 })
    assertEq('utf8', 'hexdump', 'abcdef', '00000000  61 62 63 64\n00000004  65 66', {}, { bytesPerLine: 4, ascii: false })
    assertEq('hexdump', 'utf8', '00000000  61 62 63 64\n00000004  65 66', 'abcdef')
    assertOptionError('utf8', 'hexdump', 'abc', {}, { bytesPerLine: 0 }, 'bytesPerLine')

    // IPv6
    assertEq('ipv6', 'ipv6', '2001:db8::1', '2001:0db8:0000:0000:0000:0000:0000:0001', {}, { compress: false })
    assertEq('ipv6', 'ipv6', '2001:0db8:0000:0000:0000:0000:0000:0001', '2001:db8::1')

    // Reverse
    assertEq('utf8', 'reverse', 'hello big  world', 'world  big hello', {}, { by: 'words' })
    assertEq('utf8', 'reverse', 'one\ntwo\nthree', 'three\ntwo\none', {}, { by: 'lines' })
    assertEq('reverse', 'utf8', 'a\r\nb', 'b\r\na', { by: 'lines' })

    // Options resolver
    assertOptionError('utf8', 'base64', 'a', {}, { wrap: '10' }, 'wrap')

    // Asynchronous tests (PBKDF2)
    Promise.all([
        // Recompute the digest from the returned random salt
        assertPbkdf2('password'),
        // RFC 6070 test vector
        assertAsyncEq('utf8', 'pbkdf2', 'password', '0c60c80f961f0e71f3a9b524af6012062fe037a6', {},
            { hash: 'SHA-1', iterations: 1, keyLength: 160, salt: '73616c74', output: 'digest' }),
        // Reference value from Python hashlib.pbkdf2_hmac
        assertAsyncEq('utf8', 'pbkdf2', 'password', 'pbkdf2$sha512$2$73616c74$e1d9c16aa681708a45f5c7c4e215ceb66e011a2e9f0040713f18aefdb866d53cf76cab2868a39b9f7840edce4fef5a82be67335c77a6068e04112754f27ccf4e', {},
            { hash: 'SHA-512', iterations: 2, keyLength: 512, salt: '73616c74' }),
        convertWithOptions('utf8', 'pbkdf2', 'x', {}, { salt: 'zz', iterations: 1 }).then(
            () => { console.error('pbkdf2: invalid salt accepted'); testRunnerTotalErrors++ },
            error => { if (!(error instanceof OptionError && error.optionId === 'salt')) { console.error('pbkdf2: wrong salt error', error); testRunnerTotalErrors++ } }
        ),
    ]).then(() => {
        if (testRunnerTotalErrors > 0) console.error('Asynchronous tests finished with errors.')
        else console.log('Asynchronous (PBKDF2) tests passed.')
    })


    if (testRunnerTotalErrors == 0) {
        console.log('All tests passed!')
        return true
    } else {
        console.error(`${testRunnerTotalErrors} tests failed.`)
        return false
    }
}

// Run from the browser console: runTests()
window.runTests = runTests
