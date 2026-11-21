const transactionModel = require('../models/transaction.model')
const ledgerModel = require('../models/ledger.model')
const emailService = require('../services/email.services')
const accountModel = require('../models/account.model')
const mongoose = require('mongoose')

async function createTransaction(req, res) {

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "From account, to account, amount, and idempotency key are required",
        })
    }

    const fromUserAccount = await accountModel.findOne({ _id: fromAccount })
    const toUserAccount = await accountModel.findOne({ _id: toAccount })

    if(!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid from or to account"
        })
    }

    const isTransactionExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(isTransactionExists) {
        if(isTransactionExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already completed",
                transaction: isTransactionExists
            })
        }

        if(isTransactionExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still pending",
                transaction: isTransactionExists
            })
        }

        if(isTransactionExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction has failed",
                transaction: isTransactionExists
            })
        }

        if(isTransactionExists.status === "REVERSED") {
            return res.status(200).json({
                message: "Transaction has been reversed",
                transaction: isTransactionExists
            })
        }

        if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both accounts must be active to perform a transaction"
            })
        }
            
    }

    const userBalance = await fromUserAccount.getBalance()

    if(userBalance < amount) {
        return res.status(400).json({
            message: `Insufficient balance in the from account. Current balance is ${userBalance}`
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = (await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }], {session}))[ 0 ]

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], {session})

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], {session})

    await transactionModel.findOneAndUpdate(
        {_id: transaction._id},
        {status: "COMPLETED"},
        {session}
    )

    await session.commitTransaction()
    session.endSession()

    await emailService.sendTransactionEmail(
        req.user.email,
        req.user.name,
        amount,
        fromUserAccount._id,
        toUserAccount._id
    )

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })
    

}

async function createInitialFundsTransaction(req, res) {
    
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "To account, amount, and idempotency key are required",
        })
    }

    const toUserAccount = await accountModel.findOne({ _id: toAccount })

    if(!toUserAccount) {
        return res.status(404).json({
            message: "Invalid to account"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if(!fromUserAccount) {
        return res.status(404).json({
            message: "System user account not found"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], {session})
    
    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], {session})
    
    transaction.status = "COMPLETED"
    await transaction.save({session})

    session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })

}

module.exports = { createTransaction, createInitialFundsTransaction }