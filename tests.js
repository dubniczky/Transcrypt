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


    if (testRunnerTotalErrors == 0) {
        console.log('All tests passed!')
        return true
    } else {
        console.error(`${testRunnerTotalErrors} tests failed.`)
        return false
    }
}