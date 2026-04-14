import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { SQUADS, USER_ROLES } from "../utils/constants.js";

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, squad, batch, role, adminInviteToken } = req.body;

    if (!name || !email || !password || !squad || !batch) {
      return res.status(400).json({ message: "Name, email, password, squad, and batch are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    if (!SQUADS.includes(squad)) {
      return res.status(400).json({ message: "Invalid squad selected." });
    }

    const squadMemberCount = await User.countDocuments({ squad });
    if (squadMemberCount >= 8) {
      return res.status(400).json({ message: `${squad} already has 8 members assigned.` });
    }

    let resolvedRole = USER_ROLES.EMPLOYEE;
    if (role === USER_ROLES.ADMIN) {
      if (!process.env.ADMIN_INVITE_TOKEN || adminInviteToken !== process.env.ADMIN_INVITE_TOKEN) {
        return res.status(403).json({ message: "A valid admin invite token is required to create an admin." });
      }
      resolvedRole = USER_ROLES.ADMIN;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      squad,
      batch,
      role: resolvedRole,
    });

    const token = createToken(user._id);

    return res.status(201).json({
      message: "Registration successful.",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = createToken(user._id);

    return res.json({
      message: "Login successful.",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res) => {
  res.json({ user: req.user.toJSON() });
};
