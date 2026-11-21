const express = require('express')
const transactionController = require('../controllers/transactions.controller')
const authMiddleware = require('../middleware/auth.middleware')

const transactionRouter = express.Router()

transactionRouter.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

transactionRouter.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRouter