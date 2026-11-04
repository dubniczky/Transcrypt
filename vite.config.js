import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Vite does not inline assets referenced from HTML <link> tags, so embed the favicon as a data URI
function inlineFavicon() {
    const faviconPath = 'src/favicon.png'
    return {
        name: 'inline-favicon',
        transformIndexHtml: {
            order: 'pre', // Run before Vite turns the href into a separate asset file
            handler(html) {
                const dataUri = 'data:image/png;base64,' + readFileSync(faviconPath).toString('base64')
                return html.replace(`href="./${faviconPath}"`, `href="${dataUri}"`)
            },
        },
    }
}

// Builds the whole app (HTML, JS, CSS, favicon and the npm libraries) into one self-contained dist/index.html.
// The page makes no network requests, so it can be shared as a single file and opened offline.
export default defineConfig({
    plugins: [inlineFavicon(), viteSingleFile()],
    build: {
        target: 'es2022',
    },
    // Unit tests (npm test). They run in Node and are not part of the built website.
    // Files that need a DOM opt in with a `// @vitest-environment jsdom` comment.
    test: {
        include: ['tests/**/*.test.js'],
        environment: 'node',
        reporters: ['tree'], // List every test with its result, grouped by describe block
    },
})
