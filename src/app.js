const express = require('express')

const authRouter = require('./routes/auth.routes')
const accountRouter = require('./routes/account.routes')
const transactionRoutes = require('./routes/transactions.routes')

const cookieParser = require('cookie-parser')
const cors = require('cors')

const app = express()

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)

module.exports = app