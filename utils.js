const mongoose = require('mongoose')

function connectToDatabase(uri, options = { useNewUrlParser: true }) {
    let conn
    try {
        mongoose.connect(uri, options)
        conn = mongoose.connection
    } catch(ex) {
        throw new Error(ex)
    }
    return conn
}

module.exports.connectToDatabase = connectToDatabase
