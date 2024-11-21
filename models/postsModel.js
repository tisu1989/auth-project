const mongoose = require("mongoose");
const postsSchema = new mongoose.Schema({
    title : {
        type : String,
        required : [true, "Title is required"], 
        trim:true,
},
    description : {
        type : String,
        required : [true, "Description is required"], 
        trim:true,
},
userId : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "User",
    required : [true, "User ID is required"]
}
}, {timestamps : true});
module.exports = mongoose.model("Post", postsSchema)