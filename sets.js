
const Debug = require('debug')
const { schemes, colors } = require('./colors.js')
const { maxIteration } = require('./config.json')

const log = Debug('colors')
const buildLog = Debug('scheme-build')

const regexSets = [
    /*
    [
        <regular expression>,
        [
            <hex color>,
            <hex color>
        ]
    ]
    */
]

for (const name of Object.keys(schemes)) {
    regexSets.push([
        new RegExp(`^${name}`, 'i'),
        schemes[name].set
    ])
}
for (const color of Object.keys(colors)) {
    regexSets.push([
        new RegExp(`^${color}`, 'i'),
        [colors[color]]
    ])
}
Object.freeze(regexSets)
log(`generated color sets with ${regexSets.length} entries`)

const schemeCache = {
    /*
    <set string>: <scheme>
    */
}

function Set (set) {
    if (schemeCache[set]) return schemeCache[set]

    set = set.replace(/-/g, '')

    const originalSet = set + ''

    if (!/^[a-zA-Z]+$/.test(set)) throw new Error('Bad set, must match /^[a-zA-Z]+$/')

    let scheme = []

    let i = 0
    while (true) {
        if (i >= maxIteration) throw new Error('Bad set, reached iteration maximum')

        let bestMatch = null

        buildLog(`building next section for ${originalSet} from ${set}`)

        for (const pair of regexSets) {
            const regex = pair[0]
            const colors = pair[1]

            const replaced = set.replace(regex, '')
            if (replaced !== set) {
                if (
                    !bestMatch ||
                    bestMatch[0].length >= /* > */ replaced.length
                ) {
                    bestMatch = [
                        replaced,
                        colors
                    ]
                    buildLog(`new best match for ${set} with ${regex}`)
                }
            }
        }

        if (!bestMatch) break // Break if no sequences matched

        set = bestMatch[0]
        scheme = scheme.concat(bestMatch[1])

        i++
    }

    if (!scheme.length) {
        throw new Error(`Bad set '${set}', matched nothing`)
    }
    if (set) {
        throw new Error(`Bad set, matches but remaining sequence '${set}' is not valid`)
    }

    buildLog(`built scheme ${scheme} for set ${originalSet}`)

    schemeCache[set] = scheme

    return scheme
}

Object.defineProperty(Set, 'colors', { value: colors })
Object.defineProperty(Set, 'schemes', { value: schemes })
Object.freeze(Set)

module.exports = Set
