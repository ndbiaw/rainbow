
const Debug = require('debug')
const ManagedRole = require('./role.js')

const log = Debug('guild')
const updateLog = Debug('guild-update')

const loadedGuilds = {
    /*
    <guild id>: <ManagedGuild instance>
    */
}

function getManagedGuild (guild) {
    if (!loadedGuilds[guild.id]) {
        log(`guild ${guild.id} (${guild.name}) is not loaded, creating new ManagedGuild`)
        loadedGuilds[guild.id] = new ManagedGuild(guild)
    }
    return loadedGuilds[guild.id]
}

function ManagedGuild (guild) {
    let roles

    function buildRoles () {
        updateLog(`building roles for guild ${guild.id} (${guild.name})`)

        if (!roles) roles = {}
        const newRoles = {}

        for (const role of guild.roles.array()) {
            if (!roles[role.id]) {
                try {
                    updateLog(`attempting to update role ${role.id} (${role.name})`)
                    roles[role.id] = new ManagedRole(role)
                } catch (err) {
                    updateLog(`failed to update role ${role.id} (${role.name}) on ${guild.id} (${guild.name}), not manageable`, err.message)
                    continue
                }
            }
            newRoles[role.id] = roles[role.id]
        }

        roles = newRoles
    }

    async function update () {
        buildRoles()
        for (const role of Object.values(roles)) {
            try {
                await role.update()
            } catch (err) {
                updateLog(`failed to update role ${role.id} (${role.name}) on ${guild.id} (${guild.name}), update failed`, err.message)
            }
        }
    }

    Object.defineProperties(this, {
        roles: { value: roles },
        update: { value: update }
    })

    log(`guild ${guild.id} (${guild.name}) loaded`)
}

Object.defineProperty(ManagedGuild, 'get', {
    value: getManagedGuild
})
Object.freeze(ManagedGuild)

module.exports = ManagedGuild
