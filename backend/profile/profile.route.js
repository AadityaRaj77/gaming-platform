import express from "express";
import {
  getMyProfile,
  upsertProfile,
  searchProfiles,
  getPublicProfile
} from "./profile.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Private
router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, upsertProfile);

// Public discovery
router.get("/search", searchProfiles);
router.get("/public/:userId", getPublicProfile);

export default router;
