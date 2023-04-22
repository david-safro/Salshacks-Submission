const mongoose = require('mongoose');

const Classroom = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    members: {
        type: [String],
        required: true
    }
});

module.exports = mongoose.model('Classroom', Classroom);