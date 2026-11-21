const mongoose = require('mongoose')

async function connectToDB() {
    mongoose.connect(process.env.MONGO_URL)
        .then(() => {
            console.log("Database connected ..");
        }).catch(err => {
            console.log("Error occurred while connecting to Database .!")
            process.exit(1)
        })
}

module.exports = connectToDB