import express from "express";
import { getMyProfile, upsertProfile } from "./profile.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, upsertProfile);

export default router;
