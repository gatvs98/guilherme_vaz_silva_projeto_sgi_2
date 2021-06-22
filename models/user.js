const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    google: {
        type: Object,
        required: true
    }
})

module.exports = mongoose.model('User', userSchema);