# Transcrypt

Fully web-based converter between various encoding formats (utf8, hex, base64) and hashes.

Available at: https://convert.dubniczky.com

## Rationale

Many converter tools exist on the internet, but most focus on one specific type of conversion, such as text to base64 and reverse. I wanted to create a tool that:

- Works exclusively from the browser, thus only requiring static hosting
- It allowth both encoding from and decoding to many formats with universal compatibility
- It has an easy and intuitive user interface

## Technical Details

The biggest challenge from these by far was making sure that the universal conversion works between all formats and without having to create specific converters between all format combinations, resulting in $n^2$ functions to perform (technically $n*k$, as the number of input and output formats are not the same).

Default JavaScript does not have support for "bytes" as an object type, so there are no built-in methods for conversion to and from bytes. The closes thing we have are `UInt8Array` objects that work quite similarly, but lack the built-in compatibility. Eventually I decided to create two converter for each type, one that converts it to __UInt8Array__ or converts it from __UInt8Array__. Each conversion happens by converting the input to this custom `bytes` object, then converting those bytes to any of the output formats.