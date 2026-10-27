import { authService } from "./auth.service.js";
import { userService } from "../user/user.service.js";
import bcrypt from "bcrypt";

export class AuthController {
  async register(req, res) {
    const { username, email, password } = req.body;

    try {
      const [userByEmail, userByUsername] = await Promise.all([
        userService.findByEmail(email),
        userService.findByUsername(username),
      ]);

      if (userByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      if (userByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const newUser = await userService.createUser({
        username,
        email,
        password,
      });

      return res.status(201).json({
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      });
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          message: `${field} already exists`,
        });
      }
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await userService.findUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = authService.generateToken(user);

      return res.status(200).json({
        token,
        userId: user._id,
        username: user.username,
      });
    } catch (error) {
      return res.status(500).json({ message: "Login failed" });
    }
  }
}

export const authController = new AuthController();
