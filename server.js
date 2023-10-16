const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("./models/UserModel");
const Post = require("./models/Posts");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 3000;
const secretKey = process.env.SECRET_KEY;
const mongoUrl = process.env.MONGO_URL;

app.use(express.json());
const corsOpts = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOpts));

// TO get All Users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });

    if (users.length === 0) {
      res.status(200).json({ message: "No users " });
    } else {
      const userData = users.map((user) => ({
        username: user.username,
        full_name: user.full_name,
        profile_photo: user.profile_photo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      res.status(200).json({
        data: userData,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// To Create New User
app.post("/users", async (req, res) => {
  let { username, password, profile_photo, full_name } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Both username and password are required." });
  }

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    username = username.toLowerCase();
    password = password.toLowerCase();

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      profile_photo,
      full_name,
    });
    res.status(201).json({
      message: `User ${newUser.username} created successfully`,
      data: {
        id: newUser._id,
        username: newUser.username,
        password: newUser.password,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//To Update User
app.put("/users", async (req, res) => {
  let { username, profile_photo, full_name } = req.body;

  if (!username) {
    res.status(400).json({ message: "Username is required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      res.status(400).json({ message: "User not found." });
    }

    if (profile_photo) {
      existingUser.profile_photo = profile_photo;
    }
    if (full_name) {
      existingUser.full_name = full_name;
    }

    await existingUser.save();

    res
      .status(200)
      .json({ message: "User updated successfully", data: { existingUser } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// To LogIn
app.post("/login", async (req, res) => {
  let { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Both username and password are required." });
  }

  try {
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    username = username.toLowerCase();
    password = password.toLowerCase();

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { username: existingUser.username, userId: existingUser._id },
      secretKey
    );

    res.status(200).json({
      message: "Logged in success.",
      data: { token: token, id: existingUser._id },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// To get all posts API
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ timestamp: -1 });

    if (posts.length === 0) {
      res.status(200).json({ message: "Updated already" });
    }
    res.status(200).json({ data: posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// To add post API
app.post("/posts", async (req, res) => {
  const { username, postImage, caption, likes, timestamp } = req.body;
  if (!timestamp) {
    const timestamp = new Date();
  }
  try {
    if (!username) {
      return res
        .status(400)
        .json({ message: "Authentication failed. Username is required." });
    }
    if (!postImage) {
      return res.status(400).json({ message: "Photo is required." });
    }
    if (!caption) {
      return res.status(400).json({ message: "Caption is required." });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    const post = await Post.create({
      username: username,
      postImage: postImage,
      caption: caption,
      likes: likes,
      timestamp: timestamp,
    });

    if (!post) {
      return res.status(500).json({ message: "Error while posting." });
    }

    return res.status(200).json({
      message: "Uploaded",
      data: { username: post.username, timestamp: post.timestamp },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

mongoose.set("strictQuery", false);
mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("connected to MongoDB");
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
