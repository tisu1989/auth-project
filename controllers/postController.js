const post = require("../models/postsModel");
exports.getPosts = async (req, res) => {
    const {page} = req.query;
    const postsPerPage = 10;
    try {
        let pageNum = 0;
        if(page <= 1){
            pageNum = 0;
        }else{    
            pageNum = (page-1) 
        }
        const result =  await post.find().sort({createdAt:-1}).skip(pageNum*postsPerPage).limit(postsPerPage).populate({
            path: 'userId',
            select: 'email'
        });
        res.status(200).json({
            success: true,
            message: "Posts fetched successfully",
            data: result 
        });
    } catch (err) {
        console.log(err);
    }
};
exports.createPost = async (req, res) => {
    const { title, description } = req.body;
    const {userId} = req.user;
    try {
        const {error, value} = createPostSchema.validate({  
            title,
            description,
            userId
        });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const result = await post.create({ title, description, userId });
        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: result,
        }); 
    } catch (err) {
        console.log(err);
    }
};
