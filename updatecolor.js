
const Debug = require('debug')
const Package = require('./package.json')
const Axios = require('axios')
const { token } = require('./token.json')
const { timeout, userAgent } = require('./config.json')

const log = Debug('update-color')
const errLog = Debug('update-color-error')
const verboseErrLog = Debug('update-color-error-verbose')

function getColorFromColorHex (colorHex) {
    const colorDecoded =
        (
            (
                colorHex.match(/#[0-9ABCDEF]{6}/i) ||
                []
            )[0] ||
            '#FFFFFF'
        ).substring(1)
    return parseInt(colorDecoded, 16)
}

Object.freeze(getColorFromColorHex)

async function updateColorDirect (guildID, roleID, colorHex) {
    log(
        `directly updating color for role ${guildID}/${roleID} to ${colorHex.toUpperCase()}`
    )
    let result
    try {
        result = await Axios.request({
            method: 'PATCH',
            url: `https://discordapp.com/api/guilds/${guildID}/roles/${roleID}`,
            timeout: timeout,
            headers: {
                Authorization: `Bot ${token}`,
                'User-Agent': userAgent.replace('$', Package.version),
                'Content-Type': 'application/json'
            },
            data: {
                color: getColorFromColorHex(colorHex)
            }
        })
        log(`directly updated color successfully on ${guildID}/${roleID}`)
    } catch (err) {
        let data = err
        try {
            data = err.response.data || data
        } catch (err) {}
        log(`direct update for ${guildID}/${roleID} failed!`, data)
        errLog(`direct update for ${guildID}/${roleID} failed!`, data)
        verboseErrLog(err)
        throw err
    }
    return result
}

function updateColor (role, colorHex) {
    return new Promise((resolve, reject) => {
        const guildID = role.guild.id
        const roleID = role.id
        log(
            `updating color for role ${guildID}/${roleID} to ${colorHex.toUpperCase()}`
        )
        role.setColor(colorHex)
            .then(updated => {
                log(`updated color successfully on ${guildID}/${roleID}`)
                resolve(null)
            })
            .catch(err => {
                log(`update for ${guildID}/${roleID} failed! (waiting a bit and trying again)`, err)
                errLog(`update for ${guildID}/${roleID} failed! (waiting a bit and trying again)`, err)
                setTimeout(() => {
                    reject(err)
                }, timeout)
            })
        setTimeout(() => {
            log(`update for ${guildID}/${roleID} timed out!`)
            errLog(`update for ${guildID}/${roleID} timed out!`)
            reject(new Error('Timed out'))
        }, timeout)
    })
}

Object.freeze(updateColor)
Object.freeze(updateColorDirect)

module.exports = {
    getColorFromColorHex,
    updateColor,
    updateColorDirect
}

Object.freeze(module.exports)
