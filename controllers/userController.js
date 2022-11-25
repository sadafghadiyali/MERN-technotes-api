const User = require("../models/User");
const Note = require("../models/Note");
const AsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");

const getAllUsers = AsyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean();
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }

  res.json(users);
});

const createNewUser = AsyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  //exec() returns exactly a promise. If you dont use exec, the findOne fn will not return a promise, but you can use await and then() with it
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate user" });
  }

  //hash pasword
  const salt = bcrypt.genSaltSync(10);
  const hashedPwd = bcrypt.hashSync(password, salt);

  const userObj =
    Array.isArray(roles) && roles.length
      ? { username, password: hashedPwd, roles }
      : { username, password: hashedPwd };

  const user = await User.create(userObj);

  if (user) {
    return res.status(201).json({ message: `Created user ${username}` });
  } else {
    return res.status(400).json({ message: "Invalid user data received" });
  }
});

const updateUser = AsyncHandler(async (req, res) => {
  const { id, username, roles, active, password } = req.body;
  //console.log(req.body);

  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  //console.log(id);
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    user.password = await bcrypt.hash(password, bcrypt.genSaltSync(10));
  }

  const updatedUser = await user.save();

  if (updatedUser) {
    return res.status(200).json({ message: `${updatedUser.username} updated` });
  }
});

const deleteUser = AsyncHandler(async (req, res) => {
  const { id } = req.body;

  //console.log(req.body);

  if (!id) {
    return res.status(400).json({ message: "User ID required" });
  }

  const note = await Note.findOne({ user: id }).lean().exec();

  if (note) {
    return res.status(400).json({ message: "User has assigned notes" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not Found" });
  }

  const result = await user.deleteOne();

  res.json(`Username ${result.username} with ID ${result._id} deleted`);
});

module.exports = { getAllUsers, createNewUser, updateUser, deleteUser };
