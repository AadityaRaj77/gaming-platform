import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createTournament,
  getTournamentById,
  getMyOrganizedTournaments,
  disbandTournament,
  exitTournament,
  addRoom,
} from "./tournament.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, createTournament);
router.get("/:id", authMiddleware, getTournamentById);
router.get("/", authMiddleware, getMyOrganizedTournaments);
router.post("/:id/exit", authMiddleware, exitTournament);
router.delete("/:id/disband", authMiddleware, disbandTournament);
router.post("/:id/rooms", authMiddleware, addRoom);

export default router;
