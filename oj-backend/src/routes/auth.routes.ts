import { Router, Request, Response } from "express";
import prisma from "../db/client";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate";
import { loginSchema, signupSchema } from "../validation/schemas";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { error: "Too many login attempts, try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
  message: { error: "Too many attempts for creating an account, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', signupLimiter, validate(signupSchema), async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const Email = await prisma.user.findUnique(
      { where: {email} }
    );
    if (!Email) {
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {expiresIn: "7d"});
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ username: user.username });
    } else {
      res.status(409).json({ error: "User with this email exists" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', loginLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {expiresIn: "7d"});
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ username: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out" });
});


export default router;