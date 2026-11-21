const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const emailService = require('../services/email.services')
const tokenBlackListModel = require('../models/blackList.model')

async function authMiddleware(req, res, next) {
    
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token) {
        return res.status(401).json({
            message: "Unauthorized access !!"
        })
    }

    const isBlackListed = await tokenBlackListModel.findOne({token})

    if(isBlackListed){
        return res.status(401).json({
            message: "account is Blacklisted"
        })
    }

    try{

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId)

        req.user = user
        return next()

    }catch(err) {
        return res.status(401).json({
            message: "Unauthorized access !!"
        })
    }

}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token) {
        return res.status(401).json({
            message: "Unauthorized access !!"
        })
    }

    
    const isBlackListed = await tokenBlackListModel.findOne({token})

    if(!isBlackListed){
        return res.status(401).json({
            message: "account is Blacklisted"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId)
        
        if(!user) {
            return res.status(404).json({
                message: "Access denied !!"
            })
        }

        req.user = user
        
        return next()
    
    }catch(err) {
        return res.status(401).json({
            message: "Unauthorized access !!"
        })
    }


}

module.exports = {authMiddleware, authSystemUserMiddleware}