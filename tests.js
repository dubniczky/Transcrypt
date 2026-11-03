let testRunnerTotalErrors = 0

function assertEq(from, to, input, expected) {
    // let result = converters[from][to](input)
    const toConverter = toFormats[to]['convert']
    const fromConverter = fromFormats[from]['convert']

    let result = toConverter(fromConverter(input))
    if (result == expected) {
        return true
    }
    console.error(`${from} -> ${to}: "${result}" != "${expected}"`)
    testRunnerTotalErrors++
}

function assertValid(from, input, expected) {
    const result = fromFormats[from]['validator'](input)
    if (result === expected) {
        return true
    }
    console.error(`${from} validator("${input}"): ${result} != ${expected}`)
    testRunnerTotalErrors++
}

async function assertPbkdf2(input) {
    const result = await toFormats['pbkdf2']['convert'](fromFormats['utf8']['convert'](input))
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
    
    bHex = '40d810e201413fe363b902d62f48ebce'
    bB64 = 'QNgQ4gFBP+NjuQLWL0jrzg=='

    // Text
    aText = 'the little fox JUMPS!!'
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
    assertEq('hexdump', 'utf8', toFormats['hexdump'].convert(fromFormats['utf8'].convert(dumpText)), dumpText)
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

    // PBKDF2 is asynchronous: recompute the digest from the returned salt
    assertPbkdf2('password').then(() => {
        if (testRunnerTotalErrors > 0) console.error('PBKDF2 test finished with errors.')
        else console.log('PBKDF2 test passed.')
    })


    if (testRunnerTotalErrors == 0) {
        console.log('All tests passed!')
        return true
    } else {
        console.error(`${testRunnerTotalErrors} tests failed.`)
        return false
    }
}