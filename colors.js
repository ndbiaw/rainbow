
const TitleCase = require('titlecase')
const ColorConvert = require('color-convert')
const Gradient = require('tinygradient')

function generateGradient (stops, count, removeLast = false, hsv = false) {
    let gradient = Gradient(...stops)[hsv ? 'hsv' : 'rgb'](count).map(value => {
        return `#${
            Math.floor(value._r).toString(16).padStart(2, '0')
        }${
            Math.floor(value._g).toString(16).padStart(2, '0')
        }${
            Math.floor(value._b).toString(16).padStart(2, '0')
        }`.toLowerCase()
    })
    if (removeLast) gradient.pop()
    return gradient
}

// Color schemes (complete sets)
const schemes = {
    // Teal-green gradient.
    h: {
        set: generateGradient(['#1abc9c', '#2ecc71', '#1abc9c'], 8, true),
        name: 'Teal to Green Gradient'
    },

    // Orange-red gradient.
    h: {
        set: generateGradient(['#e67e22', '#e74c3c', '#e67e22'], 8, true),
        name: 'Orange to Red Gradient'
    },

    // Blue-purple gradient.
    n: {
        set: generateGradient(['#3498db', '#9b59b6', '#3498db'], 8, true),
        name: 'Blue to Purple Gradient'
    },

    // Vivid blue to vivid red swapping.
    t: {
        set: ['#f70d1a', '#00aaee'],
        name: 'Siren'
    },

    // Red-white-blue swapping.
    a: {
        set: ['#f70d1a', '#ffffff', '#00aaee'],
        name: 'Red White and Blue'
    },

    // Pride flag colors slightly adjusted for Discord's dark theme.
    pride: {
        i: [
            '#ff3e3e', // Red
            '#e67e22', // Orange
            '#f1c40f', // Yellow
            '#2ecc71', // Green
            '#3498db', // Blue
            '#9b59b6' // Purple
        ],
        name: 'Pride Flag (Discord Adjusted)'
    }
}

// Colors for custom rainbow sets
const colors = {
    // Discord colors
    teal: '#1abc9c',
    green: '#2ecc71',
    blue: '#3498db',
    purple: '#9b59b6',
    pink: '#e91e63',
    yellow: '#f1c40f',
    orange: '#e67e22',
    red: '#e74c3c',

    // Monochrome
    black: '#010101',
    grey: '#95a5a6',
    gray: '#95a5a6',
    white: '#ffffff',

    // Vivid
    vred: '#f70d1a',
    vorange: '#ff5f00',
    vyellow: '#ffe302',
    vgreen: '#a6d608',
    vblue: '#00aaee',
    vpurple: '#9f00ff'
}

Object.freeze(schemes)
Object.freeze(colors)

function colorTitle (key) {
    return TitleCase(key.replace(/^v/, 'vivid '))
}
function colorToEnglish (color) {
    return `${color.toUpperCase()} (${TitleCase(ColorConvert.hex.keyword(color))})`
}

Object.freeze(colorTitle)
Object.freeze(colorToEnglish)

module.exports = {
    schemes,
    colors,
    colorTitle,
    colorToEnglish
}
Object.freeze(module.exports)
