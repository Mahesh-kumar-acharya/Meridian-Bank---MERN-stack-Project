const mongoose = require('mongoose')

const ledgerSchema = new mongoose.Schema({

    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Ledger must be associated with an account"],
        index: true,
        immutable: true
    }, 
    amount: {
        type: Number,
        required: [true, "Ledger amount is required"],
        min: [1, "Ledger amount should be greater than 0"],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [true, "Ledger must be associated with a transaction"],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ["CREDIT", "DEBIT"],
            message: "Ledger type can be either CREDIT or DEBIT"    
        },
        required: [true, "Ledger type is required"],
        immutable: true    

    }

})

function ledgerPreventUpdate(next) {
    throw new Error("Ledger entries cannot be updated or deleted")
}

ledgerSchema.pre("findOneAndUpdate", ledgerPreventUpdate)
ledgerSchema.pre("findOneAndDelete", ledgerPreventUpdate)
ledgerSchema.pre("updateOne", ledgerPreventUpdate)
ledgerSchema.pre("deleteOne", ledgerPreventUpdate)
ledgerSchema.pre("updateMany", ledgerPreventUpdate)
ledgerSchema.pre("deleteMany", ledgerPreventUpdate)
ledgerSchema.pre("update", ledgerPreventUpdate)
ledgerSchema.pre("delete", ledgerPreventUpdate)
ledgerSchema.pre("remove", ledgerPreventUpdate)

const ledgerModel = mongoose.model("ledger", ledgerSchema)
module.exports = ledgerModel
