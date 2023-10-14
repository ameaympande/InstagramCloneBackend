const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("./models/UserModel");

const app = express();
const port = 3000;

app.use(express.json());

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });

    if (users.length === 0) {
      res.status(200).json({ message: "No users " });
    } else {
      const userData = users.map((user) => ({
        username: user.username,
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

app.post("/users", async (req, res) => {
  let { username, password } = req.body;

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

    const newUser = await User.create({ username, password });
    res.status(201).json({
      message: `User ${newUser.username} created successfully`,
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

mongoose.set("strictQuery", false);
mongoose
  .connect(
    "mongodb+srv://admin:admin123456@ameayp.1vqrwcz.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("connected to MongoDB");
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
