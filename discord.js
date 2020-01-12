const Debug = require('debug')
const log = Debug('bot')

const token = (() => {
    try {
        const tokenObj = require('./token.json')
        const tokenStr = tokenObj.token
        if (!tokenStr) throw new Error('Invalid token string contents')
        return tokenStr
    } catch (err) {
        log('!! INVALID TOKEN !! it seems that the token.json file is invalid or nonexistent, please see the readme for more info')
        throw err
    }
})()

const Discord = require('discord.js')
const ManagedGuild = require('./guild.js')
const { schemes, colors, colorTitle, colorToEnglish } = require('./colors.js')
const { interval, rolePrefix } = require('./config.json')

const statsLog = Debug('stats')
const inviteLog = Debug('invites')
const updateLog = Debug('bot-update')

const bot = new Discord.Client()

module.exports = bot

const githubFooter = ['🌈Cầu Vồng Của Kanna🌈'] // ["View this bot on GitHub", "https://github.com/ndbiaw/rainbow"]

bot.on('disconnect', event => {
    log('bot disconnected from discord', event)
    process.exit(1)
})
bot.on('rateLimit', (info, limit, timeDiff, path, method) => {
    log('bot hit rate limit', info)
})
bot.on('error', err => {
    log('bot thrown error', err)
})
bot.on('warn', warning => {
    log('bot thrown warning', warning)
})

bot.on("ready", () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    bot.user.setPresence({
        status: "online",
        game: {
            name: "hentaivn.net",
            type: "WATCHING"
        }
    })
 })
function hasSendPermission (channel) {
    return channel.type === 'text' && channel.memberPermissions(channel.guild.me).has('SEND_MESSAGES')
}

function mainChannel (guild) {
    if (guild.systemChannelID) {
        const systemChannel = guild.channels.get(guild.systemChannelID)
        if (hasSendPermission(systemChannel)) {
            return systemChannel
        }
    }

    const general = guild.channels.find(channel => /^(general|main|chat)$/.test(channel.name))
    if (general && hasSendPermission(general)) {
        return general
    }

    const sorted = guild.channels.sort((chanA, chanB) => {
        if (!hasSendPermission(chanA)) return -1
        return chanA.position < chanB.position ? -1 : 1
    })
    const bestPossible = sorted.first()

    return bestPossible
}

function getBotAt() {
    return bot.user ? bot.user.tag : 'Rainbow Roles'
}

let mentionRegex

const paused = {
    /*
    <guild id>: <paused true/false>
    */
}
function updateAll () {
    for (const guild of bot.guilds.array()) {
        if (paused[guild.id]) continue
        updateLog(`updating guild ${guild.id} (${guild.name})`)
        const managed = ManagedGuild.get(guild)
        managed
            .update()
            .then(() => updateLog(`completed guild update ${guild.id} (${guild.name})`))
            .catch(err => log(`failed to update guild ${guild.id} (${guild.name})`, err))
    }
}
bot.on('ready', () => {
    log('bot logged into discord servers')

    setInterval(updateAll, interval * 1000)
    mentionRegex = new RegExp(`<@(!|)${bot.user.id}>`)

    let stats = 'connected to discord, currently participating in the following guilds:\n'
    bot.guilds.forEach(guild => {
        stats += `(${guild.id}) ${guild.name} joined at ${guild.joinedAt.toISOString()}\n`
        let admins = ''
        let users = ''
        guild.members.forEach(member => {
            const isAdmin = member.permissions.has(8)
            const info = `    ${isAdmin ? 'admin' : 'user '} ${member.user.tag}${member.nickname ? ` (${member.nickname})` : ''} with role ${member.highestRole.name}\n`
            if (isAdmin) admins += info
            else users += info
        })
        stats += admins
        stats += users
        guild.fetchInvites()
            .then(invites => invites.forEach(invite => {
                inviteLog(`(${guild.id}) ${guild.name} has invite ${invite.url} with ${invite.maxUses} max uses`)
            }))
            .catch(err => statsLog(`error fetching invites for guild (${guild.id}) ${guild.name}`, err.message /* err */))
    })
    statsLog(stats)
})

bot.on('guildCreate', guild => {
    log(`bot joined guild ${guild.id} (${guild.name})`)
    mainChannel(guild).send({
        embed: new Discord.RichEmbed()
            .setTitle('Rainbow Roles')
            .setDescription(`Thanks for adding Rainbow Roles to your Discord server!\nUse "@${getBotAt()} help" to get help using rainbow roles.`)
            .setFooter(...githubFooter)
    })
})

const colorsEmbed = new Discord.RichEmbed()
colorsEmbed.setTitle('Color List')
colorsEmbed.setDescription('Here are all the available colors and their color codes.')
for (const colorName of Object.keys(colors)) {
    colorsEmbed.addField(colorTitle(colorName), colorToEnglish(colors[colorName]))
}
colorsEmbed.setFooter(...githubFooter)

const setsEmbed = new Discord.RichEmbed()
setsEmbed.setTitle('Color Set List')
setsEmbed.setDescription('These are all the Rainbow Roles pre-programmed color sets.\nUse them instead of colors and they will be replaced with the colors they contain.')
for (const set of Object.values(schemes)) {
    const colors = set.set.map(colorToEnglish).join('\n')
    setsEmbed.addField(`${set.name} (${
        Object.keys(schemes).find(key => schemes[key].name === set.name)
    })`, colors)
}
setsEmbed.setFooter(...githubFooter)

bot.on('message', message => {
    if (message.author.bot) return
    if (!message.guild) return
    if (!message.isMentioned(bot.user)) return
    if (!mentionRegex.test(message.content)) return

    ;(async () => {
        /*
        help - display help for commands
        guide - simple setup guide
        colors - available colors
        sets - available sets
        pause - pause color rotations on this guild
        */

        if (/help/.test(message.content)) {
            await message.channel.send({
                embed: new Discord.RichEmbed()
                    .setTitle('Rainbow Roles Help')
                    .setDescription(`Sử dụng 🌈Cầu Vồng Của Kanna🌈 rất dễ dàng.\nSử dụng lệnh bằng cách tag bot và thêm câu lệnh phía sau (Ví Dụ: "@${getBotAt()} help")`)
                    .addField('help', 'Hiện bảng trợ giúp này và các câu lệnh.')
                    .addField('guide', 'Hiển thị hướng dẫn cài đặt và sử dụng bot.')
                    .addField('colors', 'Liệt kê những màu có thể sử dụng và tên của chúng.')
                    .addField('sets', 'Liệt kê tổ hợp màu đã được lập trình trước.')
                    .addField('pause', 'Tạm dừng tạo tên cầu vồng.')
                    .setFooter(...githubFooter)
            })
            return
        }

        if (/guide/.test(message.content)) {
            await message.channel.send({
                embed: new Discord.RichEmbed()
                    .setTitle('Usage Guide')
                    .setDescription(`Tạo tên cầu vồng rất đơn giản.\nTạo vai trò mới **dưới vai trò cao nhất bot có được** trong danh sách vai trò. \nSau đó đặt tên chúng thành \`${rolePrefix}-red\` hoặc màu khác như \`${rolePrefix}-bluegreen\`.\nCũng có thể kết hợp nhiều màu như \`${rolePrefix}-red-purple-bluegreen-white\`.\nBot sẽ tự động đổi màu tên theo những màu bạn chọn.\nBạn cũng có thể sử dụng danh sách kết hợp sẵn như \`${rolePrefix}-pride\` hoặc \`${rolePrefix}-orangetored\`.`)
                    .setFooter(...githubFooter)
            })
            return
        }

        if (/colors/.test(message.content)) {
            await message.channel.send({ embed: colorsEmbed })
            return
        }

        if (/sets/.test(message.content)) {
            await message.channel.send({ embed: setsEmbed })
            return
        }

        if (/pause|play/.test(message.content)) {
            if (!message.member.hasPermission('MANAGE_ROLES')) {
                await message.channel.send({
                    embed: new Discord.RichEmbed()
                        .setTitle('Permission Required')
                        .setDescription('Xin lỗi, bạn cần quyền quản lý vai trò để bật tắt tên cầu vồng.')
                        .setFooter(...githubFooter)
                })
                return
            }
            paused[message.guild.id] = !paused[message.guild.id]
            await message.channel.send({
                embed: new Discord.RichEmbed()
                    .setTitle(`Role Cycling ${paused[message.guild.id] ? 'Stopped' : 'Started'}`)
                    .setDescription(`Tên cầu vồng đã ${paused[message.guild.id] ? 'paused' : 'resumed'} trên máy chủ này.\nSử dụng "pause" để bật tắt tên cầu vồng.`)
                    .setFooter(...githubFooter)
            })
            return
        }

        await message.channel.send({
            embed: new Discord.RichEmbed()
                .setTitle('Command Not Found')
                .setDescription(`Xin lỗi nhưng "${message.cleanContent}" không phải là một câu lệnh đúng.\nSử dụng "help" xem các câu lệnh hợp lệ.`)
                .setFooter(...githubFooter)
        })
    })()
        .catch(err => {
            log(`failed to interpret command "${message.content}"`, err)
        })
})


bot.login(token)
