# Transcrypt

Fully web-based converter between various encoding formats (utf8, hex, base64) and hashes.

Available at: https://convert.dubniczky.com

## Rationale

Many converter tools exist on the internet, but most focus on one specific type of conversion, such as text to base64 and reverse. I wanted to create a tool that:

- Works exclusively from the browser and requires only static file hosting
- The converted data never leaves the local machine, so it can be used with sensitive information
- It allows encoding from and decoding to many formats with universal compatibility between each
- It has an easy and intuitive user interface
- It can perform more complex conversions, format shifting, hashing, and counting.

## Technical Details

The biggest challenge by far was making sure that the universal conversion works between all formats without having to create specific converters between all format combinations. One function for each pair would result in $n^2$ functions to perform (technically $n*k$, as the number of input and output formats are not the same).

I made the decision to convert every input format into bytes and convert every output format from bytes. This reduces the compexity to $2*n$. By defautl, web-based JavaScript does not support "bytes" as an object type. Therefore, there are no built-in methods for conversion to and from bytes for any format. The closest thing we have are `UInt8Array` objects that work quite similarly, but lack the built-in compatibility.

This seemed like the most manageable solution, so I created two converters for each type. One that converts it to __UInt8Array__ or converts it from __UInt8Array__. Each conversion happens by converting the input to this custom `bytes` object, then converting those bytes to any of the output formats. With this, we can perform modifications on the data both with the input and the output functions. This means that it's possible to, for example, paste a base64 encoded string, convert into bytes, which are then hashed and finally output with hex encoding. All this happens in one go.

- [app.js](./app.js) contains a list of definitions on what formats can be converted from and to
- [converters.js](./converters.js) contains the converters for each custom format

## Testing

The test cases are in [tests.js](./tests.js). After loading the web page, open the developer console and run:
```js
runTests()
```

If there are any errors in the test cases, the details will appear in the console.