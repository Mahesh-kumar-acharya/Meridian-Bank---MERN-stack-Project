const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must be assocciated with a from account "],
        index: true
    },

    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must be assocciated with a to account"],
        index: true

    },

    status: {
        type: String,
        enum: {
            values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
            message: "Status can be either pending , completed, failed or reversed"
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [true, "Transaction amount is required"],
        min: [1, "Transaction amount should be greater than 0"]
    },
    idempotencyKey: {
        type: String,
        required: [true, "Idempotency key is required for transaction"],
        unique: [true, "Idempotency key must be unique for each transaction"],
        index: true
    }    
}, {
    timestamps: true
})


const transactionModel = mongoose.model("transaction", transactionSchema)
module.exports = transactionModel