const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  username: String,
  text: String,
  timestamp: Date,
});

const PostSchema = new Schema({
  username: String,
  postImage: String,
  caption: String,
  likes: Number,
  timestamp: String,
});

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
