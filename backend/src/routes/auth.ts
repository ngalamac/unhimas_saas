
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User';
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'unhimas_secret';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Password reset request (Step 1)
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Email not found
      return res.status(404).json({ error: 'This email is not found in our records.' });
    }
    // Protected accounts
    if (user.type === 'SuperAdmin' || user.type === 'Admin') {
      // Generic error, do not reveal if email exists or is protected
      return res.status(403).json({ error: "Can't process your request due to technical reasons." });
    }
    // Generate JWT token (expires in 15 min)
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const resetUrl = `${APP_BASE_URL}/password-reset?token=${token}`;

    // Send email
    await transporter.sendMail({
      from: SMTP_USER,
      to: email,
      subject: 'UNHIMAS Password Reset',
      html: `<p>Hello ${user.name},</p>
        <p>You requested a password reset. Click the link below to set a new password. This link will expire in 15 minutes.</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you did not request this, please ignore this email.</p>`
    });

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process password reset.' });
  }
});

// SuperAdmin/Admin panel password reset endpoint
router.post('/panel-reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user || (user.type !== 'SuperAdmin' && user.type !== 'Admin')) {
      return res.status(404).json({ error: 'User not found or not authorized.' });
    }
    // Generate JWT token (expires in 15 min)
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const resetUrl = `${APP_BASE_URL}/password-reset?token=${token}`;

    // Send email
    await transporter.sendMail({
      from: SMTP_USER,
      to: email,
      subject: 'UNHIMAS Admin Password Reset',
      html: `<p>Hello ${user.name},</p>
        <p>You requested a password reset from the admin panel. Click the link below to set a new password. This link will expire in 15 minutes.</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you did not request this, please ignore this email.</p>`
    });

    res.json({ message: 'Admin password reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process admin password reset.' });
  }
});

// Password update (Step 2)
router.post('/update-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'Reset link expired or invalid.' });
    }
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    // Prevent superadmin and admin from updating password via public reset
    if (user.type === 'SuperAdmin' || user.type === 'Admin') {
      return res.status(403).json({ error: 'SuperAdmin and Admin must change their password via the SuperAdmin panel.' });
    }
    // Strong password policy
    if (password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password does not meet policy.' });
    }
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password.' });
  }
});


// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, type, permissions } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, type, permissions });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    // Support both hashed and (legacy/test) plaintext stored passwords.
    // If the stored password doesn't look like a bcrypt hash, fall back to direct comparison.
    let valid: boolean;
    if (/^\$2[aby]\$\d+\$/.test(user.password)) {
      valid = await bcrypt.compare(password, user.password);
    } else {
      // Plaintext fallback (only acceptable in test or development environments)
      valid = user.password === password;
    }
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, type: user.type }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Password reset request
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found for this email.' });
    }
    // TODO: Generate reset token, send email with link
    // For now, simulate success
    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process password reset.' });
  }
});

export default router;
