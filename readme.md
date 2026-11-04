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
- It can decode JSON Web Tokens (JWT) into readable JSON, locally, without sending the token anywhere. The signature is not verified.

## Technical Details

The biggest challenge by far was making sure that the universal conversion works between all formats without having to create specific converters between all format combinations. One function for each pair would result in $n^2$ functions to perform (technically $n*k$, as the number of input and output formats are not the same).

I made the decision to convert every input format into bytes and convert every output format from bytes. This reduces the compexity to $2*n$. By defautl, web-based JavaScript does not support "bytes" as an object type. Therefore, there are no built-in methods for conversion to and from bytes for any format. The closest thing we have are `UInt8Array` objects that work quite similarly, but lack the built-in compatibility.

This seemed like the most manageable solution, so I created two converters for each type. One that converts it to __UInt8Array__ or converts it from __UInt8Array__. Each conversion happens by converting the input to this custom `bytes` object, then converting those bytes to any of the output formats. With this, we can perform modifications on the data both with the input and the output functions. This means that it's possible to, for example, paste a base64 encoded string, convert into bytes, which are then hashed and finally output with hex encoding. All this happens in one go.

- [src/converters.js](./src/converters.js) contains the converters for each custom format
- [src/formats.js](./src/formats.js) defines the input and output formats and their sidebar options
- [src/app.js](./src/app.js) wires up the user interface

## Building

The app is built with [Vite](https://vite.dev) and [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) into **one self-contained HTML file**. The JavaScript, CSS, favicon and libraries (Bootstrap CSS, CryptoJS) are all inlined, so the page makes no network requests. It can be shared as a single file and opened offline.

```bash
npm install
npm run dev      # development server with live reload
npm run build    # creates dist/index.html
npm run preview  # serves the built dist/ folder
npm test         # runs the unit tests
```

Pushing to `main` builds and deploys `dist/` to GitHub Pages via [.github/workflows/deploy.yml](./.github/workflows/deploy.yml).

## Testing

The unit tests use [Vitest](https://vitest.dev) and live in [tests/](./tests). They run in Node, not in the browser, and are not part of the built website.

```bash
npm test             # run all tests once and list every result
npm run test:watch   # re-run the tests on every file change
```

- [tests/conversions.test.js](./tests/conversions.test.js) covers every format, validator and sidebar option. Hashes, HMAC, PBKDF2, CRC32 and ASCII85 are checked against reference values from Python and RFC 6070.
- [tests/dom.test.js](./tests/dom.test.js) covers the HTML entity decoding, which needs a DOM (jsdom).

The tests also run in the deployment workflow, and a failing test stops the deployment.
