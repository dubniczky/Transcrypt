morseAlphabet = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    ' ': '/'
}

function textToMorse(text) {
    return text.toUpperCase().split('').map(char => morseAlphabet[char] || '').join(' ')
}
function morseToText(morse) {
    const morseToChar = Object.fromEntries(Object.entries(morseAlphabet).map(([k, v]) => [v, k]))
    return morse.split(' ').map(code => morseToChar[code] || ' ').join('')
}
