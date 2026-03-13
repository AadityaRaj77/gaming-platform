import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  createTournament,
  getTournamentById,
  getMyOrganizedTournaments,
  disbandTournament,
  exitTournament,
  saveRegistrationForm,
  publishTournament,
  unpublishTournament,
  registerForTournament,
  listPublicTournaments,
  getTournamentForRegistration
} from "./tournament.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, createTournament);

router.get("/list", listPublicTournaments);

router.get("/", authMiddleware, getMyOrganizedTournaments);

router.get("/:id", authMiddleware, getTournamentById);

router.post("/:id/exit", authMiddleware, exitTournament);

router.delete("/:id/disband", authMiddleware, disbandTournament);

router.put("/:id/form", authMiddleware, saveRegistrationForm);

router.post("/:id/publish", authMiddleware, publishTournament);

router.post("/:id/unpublish", authMiddleware, unpublishTournament);

router.get("/:id/register/:slug", getTournamentForRegistration);

router.post("/:id/register", authMiddleware, registerForTournament);

export default router;
