const mongoose = require("mongoose");
const usersSchema = new mongoose.Schema({
    email : {
        type : String,
        required : [true, "Email is required"], unique : [true, "Email already exists"], 
        lowercase : true,
        trim:true,
        minlength:[5,"Email should be at least 5 characters"]
    },
    password : {
        type : String,
        required : [true, "Password is required"], 
        trim:true,
        select : false
    },  
    verified : {
        type : Boolean,
        default : false
    },
    verificationCode : {
        type : String,
        select : false
    },
    verificationCodeValidation : {
        type : String,
        select : false
    },
    forgotPasswordCode : {
        type : String,
        select : false
    },
    forgotPasswordCodeValidation : {
        type : String,
        select : false
    }
    
},{
    timestamps : true
});
module.exports = mongoose.model("User", usersSchema)