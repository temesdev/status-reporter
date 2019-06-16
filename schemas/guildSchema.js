const mongoose = require('mongoose')

const guildSchema = new mongoose.Schema({
    id: String,
    channel: String,
    tracking: [],
    messages: []
})

module.exports = mongoose.model('guild', guildSchema, 'guild');
