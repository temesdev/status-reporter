const Discord = require('discord.js')
const client = new Discord.Client()
const { connectToDatabase } = require('./utils.js')
const guild = require('./schemas/guildSchema.js')
let db

const emojis = {
    online: '589834387168952351',
    idle: '589834361784893628',
    dnd: '589834307267198976',
    offline: '589834254569963530'
}

async function fetch(data) {
    return client.guilds.get(data.id).channels.get(data.channel).fetchMessage(data.message)
}

async function findMany(filter, options = {}) {
    let cursor, result

    try {
        cursor = await db.collection('test')
		.find(filter)
        .sort(options.sort || {})
        .skip(options.skip || 0)
        .limit(options.limit || 0)

		result = await cursor.toArray()
		cursor.close()

		return result
    } catch(e) {
        throw new Error(e)
    }
}

async function constructEmbed(data) {
    let e = { fields: [], color: 0x36393f, description: `[Invite me](https://discordapp.com/api/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=2048) or vote [here](asd.com)` }
    let c = []
    let message = await fetch(data)
    data.tracking.forEach(m => {
        let user = client.users.get(m)
        e.fields.push({ name: user.username, value: `<:${user.presence.status}:${emojis[user.presence.status]}>${user.presence.status}`, inline: true })
    })

    message.edit({ embed: e })
}

async function initGuild(guild, message) {
    let chan = client.channels.get(message.mentions.channels.firstKey())
    if(await db.collection('test').findOne({ id: guild.id }) !== null) {
        message.channel.send('Report already exists, generating new one.')
        let m = await chan.send('<:offline:589834307267198976>Initializing...')
        await db.collection('test').findOneAndUpdate({ id: guild.id }, { $set: { id: guild.id, channel: message.mentions.channels.firstKey(), tracking: message.mentions.users.keyArray(),  message: m.id } })
    } else {
        let m = await chan.send('<:offline:589834307267198976>Initializing...')
        await db.collection('test').insertOne({ id: guild.id, channel: message.mentions.channels.firstKey(), tracking: message.mentions.users.keyArray(),  message: m.id })
    }

    let b = await db.collection('test').findOne({ id: guild.id })
    constructEmbed(b)
}

client.on('ready', _ => {
    console.log('Hello world!')
    db = connectToDatabase('mongodb://localhost:27017/statusreporter')
})

client.on('presenceUpdate', async (oldMember, newMember) => {
    let oldStatus = oldMember.presence.status
    let newStatus = newMember.presence.status
    if(oldStatus === newStatus) return console.log('Statuses are the same, ignoring.')
    let memberId = newMember.user.id
    let gs = await findMany({ tracking: { $in: [ memberId ] } })
    gs.forEach(g => {
        constructEmbed(g)
    })
})

client.on('message', message => {
    if(message.author.bot) return

    if(message.content.toLowerCase() == 'sr!help') {
        message.channel.send(`Hi, I'm the fucking status reporter\ni have this command\nsr!init <#${message.channel.id}> <@${message.author.id}>\ncool\nright?`)
    }

    if(message.content.toLowerCase().startsWith('sr!init')) {
        //initGuild(message.guild, message)
        let m = message.mentions
        if(m.channels.size != 1) return message.channel.send('You must mention 1 channel')
        if(m.users.size < 1) return message.channel.send('You must mention at least 1 user')
        if(m.users.size > 25) return message.channel.send('Due to Discords limits, you can only report statuses of up to 25 users')
        initGuild(message.guild, message)
        console.log(message.mentions.users.keyArray(), message.mentions.channels.firstKey())
    }

    if(message.author.id != "321242389106786314" || !message.content.startsWith('pls eval')) return
    try {
        const code = message.content.slice(8)
        let evaled = eval(code)
        if(typeof evaled !== "string") evaled = require("util").inspect(evaled)
        message.channel.send(evaled, {code:"xl"})
    } catch (err) {
        message.channel.send(`\`ERROR\` \`\`\`xl\n${err}\n\`\`\``)
    }
})

client.login(require('./config.json').token)
