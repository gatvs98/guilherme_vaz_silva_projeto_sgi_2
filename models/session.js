const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('SessionObject', sessionSchema);