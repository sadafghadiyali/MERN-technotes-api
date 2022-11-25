const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "All fields are required" });

  const foundUser = await User.findOne({ username }).exec();

  if (!foundUser || !foundUser.active)
    return res.status(401).json({ message: "Forbidden" });

  const match = bcrypt.compare(password, foundUser.password);

  if (!match) return res.status(401).json({ message: "Unauthorized" });

  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: foundUser.username,
        roles: foundUser.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "10m" }
  );

  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "20m" }
  );

  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross site cookiee
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  res.json({ accessToken });
});
const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();
      //console.log(foundUser);

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            roles: foundUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10m" }
      );
      res.json({ accessToken });
    }
  );
};
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //no content
  res.clearCookie("jwt", {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None",
  });

  res.json({ message: "Cookie Cleared" });
};

// const logout = (req, res) => {
//   const cookies = req.cookies
//   if (!cookies?.jwt) return res.sendStatus(204) //No content
//   res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
//   res.json({ message: 'Cookie cleared' })
// }

module.exports = { login, refresh, logout };
