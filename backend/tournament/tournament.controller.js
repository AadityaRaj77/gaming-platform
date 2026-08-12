import { prisma } from "../db/prisma.js";
import crypto from "crypto";

const getId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const validEnum = (value, values) => values.includes(value);

export const createTournament = async (req, res) => {
  try {
    const userId = req.user.userId;
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const venueType = body.venueType;
    const feeType = body.feeType;
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const games = Array.isArray(body.games) ? body.games : [];
    const requirements = Array.isArray(body.requirements) ? body.requirements : [];
    const organizers = Array.isArray(body.organizers) ? body.organizers : [];

    if (!name || !validEnum(venueType, ["ONLINE", "OFFLINE"]) || !validEnum(feeType, ["FREE", "PAID"])) {
      return res.status(400).json({ message: "Invalid tournament details" });
    }
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return res.status(400).json({ message: "Invalid tournament dates" });
    }
    if (!games.length || !games.every(g => getId(g))) {
      return res.status(400).json({ message: "At least one valid game is required" });
    }
    if (feeType === "PAID" && (!Number.isFinite(Number(body.feeAmount)) || Number(body.feeAmount) < 0)) {
      return res.status(400).json({ message: "Valid feeAmount is required for paid tournaments" });
    }
    if (venueType === "OFFLINE" && (!body.location || typeof body.location !== "string" || !body.location.trim())) {
      return res.status(400).json({ message: "Location is required for offline tournaments" });
    }

    const uniqueGameIds = [...new Set(games.map(getId))];
    const activeGames = await prisma.game.findMany({
      where: { id: { in: uniqueGameIds }, isActive: true },
      select: { id: true }
    });
    if (activeGames.length !== uniqueGameIds.length) {
      return res.status(400).json({ message: "One or more selected games are invalid or inactive" });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        tagline: typeof body.tagline === "string" ? body.tagline.trim() || null : null,
        venueType,
        location: venueType === "OFFLINE" ? body.location.trim() : null,
        startDate,
        endDate,
        createdBy: userId,
        feeType,
        feeAmount: feeType === "PAID" ? Number(body.feeAmount) : null,
        bannerUrl: typeof body.bannerUrl === "string" ? body.bannerUrl.trim() || null : null,
        status: "DRAFT",
        games: { create: uniqueGameIds.map(gameId => ({ gameId })) },
        requirements: {
          create: requirements
            .filter(text => typeof text === "string" && text.trim())
            .map(text => ({ text: text.trim() }))
        },
        organizers: { create: [{ userId }] }
      }
    });

    if (organizers.length) {
      const usernames = [...new Set(organizers.filter(name => typeof name === "string").map(name => name.trim()).filter(Boolean))];
      const users = await prisma.user.findMany({ where: { username: { in: usernames } }, select: { id: true } });
      const additionalOrganizerIds = users.map(u => u.id).filter(id => id !== userId);
      if (additionalOrganizerIds.length) {
        await prisma.tournamentOrganizer.createMany({
          data: additionalOrganizerIds.map(organizerId => ({ userId: organizerId, tournamentId: tournament.id })),
          skipDuplicates: true
        });
      }
    }

    res.status(201).json({ message: "Tournament created", tournamentId: tournament.id });
  } catch (err) {
    console.error("createTournament:", err);
    res.status(500).json({ message: "Failed to create tournament" });
  }
};

export const getTournamentById = async (req, res) => {
  try {
    const id = getId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid tournament id" });

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        games: { include: { game: true } },
        requirements: true,
        organizers: { include: { user: { select: { id: true, username: true } } } }
      }
    });
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    res.json(tournament);
  } catch (err) {
    console.error("getTournamentById:", err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};

export const getMyOrganizedTournaments = async (req, res) => {
  try {
    const rows = await prisma.tournamentOrganizer.findMany({ where: { userId: req.user.userId }, include: { tournament: true } });
    res.json(rows.map(r => r.tournament));
  } catch (err) {
    console.error("getMyOrganizedTournaments:", err);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
};

export const exitTournament = async (req, res) => {
  try {
    const tournamentId = getId(req.params.id);
    if (!tournamentId) return res.status(400).json({ message: "Invalid tournament id" });

    const result = await prisma.tournamentOrganizer.deleteMany({ where: { tournamentId, userId: req.user.userId } });
    if (!result.count) return res.status(404).json({ message: "You are not an organizer" });
    res.json({ message: "Left tournament" });
  } catch (err) {
    console.error("exitTournament:", err);
    res.status(500).json({ message: "Exit failed" });
  }
};

export const disbandTournament = async (req, res) => {
  try {
    const id = getId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid tournament id" });

    const tournament = await prisma.tournament.findUnique({ where: { id }, select: { createdBy: true } });
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    if (tournament.createdBy !== req.user.userId) return res.status(403).json({ message: "Only creator can disband" });

    await prisma.tournament.delete({ where: { id } });
    res.json({ message: "Tournament deleted" });
  } catch (err) {
    console.error("disbandTournament:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

export const saveRegistrationForm = async (req, res) => {
  try {
    const tournamentId = getId(req.params.id);
    const fields = Array.isArray(req.body?.fields) ? req.body.fields : null;
    if (!tournamentId || !fields) return res.status(400).json({ message: "Valid tournament id and fields are required" });

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { createdBy: true } });
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    if (tournament.createdBy !== req.user.userId) return res.status(403).json({ message: "Only creator can edit form" });

    const allowedTypes = ["TEXT", "NUMBER", "ALPHABET", "CHARACTER", "MULTI_SELECT", "PAYMENT"];
    const normalizedFields = fields.map(f => ({
      label: typeof f.label === "string" ? f.label.trim() : "",
      fieldType: f.fieldType,
      required: f.required ?? true,
      allowMultiple: f.allowMultiple ?? false,
      defaultValue: f.defaultValue ?? null,
      paymentMeta: f.paymentMeta ?? null
    }));

    if (normalizedFields.some(f => !f.label || !allowedTypes.includes(f.fieldType))) {
      return res.status(400).json({ message: "Invalid registration field" });
    }

    await prisma.$transaction(async tx => {
      await tx.tournamentFormField.deleteMany({ where: { tournamentId } });
      if (normalizedFields.length) {
        await tx.tournamentFormField.createMany({ data: normalizedFields.map(f => ({ tournamentId, ...f })) });
      }
    });

    res.json({ message: "Form saved" });
  } catch (err) {
    console.error("saveRegistrationForm:", err);
    res.status(500).json({ message: "Form save failed" });
  }
};

export const publishTournament = async (req, res) => {
  try {
    const id = getId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid tournament id" });

    const t = await prisma.tournament.findUnique({ where: { id }, include: { formFields: true } });
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    if (t.createdBy !== req.user.userId) return res.status(403).json({ message: "Only creator can publish" });
    if (t.status !== "DRAFT") return res.status(400).json({ message: "Only draft tournaments can be published" });
    if (!t.formFields.length) return res.status(400).json({ message: "Create registration form first" });

    const slug = crypto.randomBytes(6).toString("hex");
    await prisma.tournament.update({ where: { id }, data: { shareSlug: slug, status: "PUBLISHED" } });
    res.json({ message: "Tournament published", shareSlug: slug });
  } catch (err) {
    console.error("publishTournament:", err);
    res.status(500).json({ message: "Publish failed" });
  }
};

export const unpublishTournament = async (req, res) => {
  try {
    const id = getId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid tournament id" });

    const t = await prisma.tournament.findUnique({ where: { id }, select: { createdBy: true, status: true } });
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    if (t.createdBy !== req.user.userId) return res.status(403).json({ message: "Only creator can unpublish" });
    if (t.status !== "PUBLISHED") return res.status(400).json({ message: "Tournament is not published" });

    await prisma.tournament.update({ where: { id }, data: { shareSlug: null, status: "DRAFT" } });
    res.json({ message: "Tournament unpublished" });
  } catch (err) {
    console.error("unpublishTournament:", err);
    res.status(500).json({ message: "Unpublish failed" });
  }
};

export const listPublicTournaments = async (req, res) => {
  try {
    const rows = await prisma.tournament.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: { games: { include: { game: true } }, requirements: true }
    });
    res.json(rows);
  } catch (err) {
    console.error("listPublicTournaments:", err);
    res.status(500).json({ message: "List failed" });
  }
};

export const getTournamentForRegistration = async (req, res) => {
  try {
    const id = getId(req.params.id);
    const slug = typeof req.params.slug === "string" ? req.params.slug : "";
    if (!id || !slug) return res.status(400).json({ message: "Invalid registration link" });

    const t = await prisma.tournament.findUnique({ where: { id }, include: { formFields: true, games: true } });
    if (!t || t.status !== "PUBLISHED" || t.shareSlug !== slug) return res.status(404).json({ message: "Registration not available" });
    res.json(t);
  } catch (err) {
    console.error("getTournamentForRegistration:", err);
    res.status(500).json({ message: "Failed" });
  }
};

export const registerForTournament = async (req, res) => {
  try {
    const tournamentId = getId(req.params.id);
    const gameId = getId(req.body?.gameId);
    const responses = req.body?.responses;
    const paymentInfo = req.body?.paymentInfo;

    if (!tournamentId || !gameId || !responses || typeof responses !== "object" || Array.isArray(responses)) {
      return res.status(400).json({ message: "Valid gameId and responses are required" });
    }

    const t = await prisma.tournament.findUnique({ where: { id: tournamentId }, include: { formFields: true, games: true } });
    if (!t || t.status !== "PUBLISHED") return res.status(400).json({ message: "Tournament not accepting registrations" });

    if (!t.games.some(g => g.gameId === gameId)) {
      return res.status(400).json({ message: "Selected game is not part of this tournament" });
    }

    for (const f of t.formFields) {
      const value = responses[f.label];
      if (f.required && (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0))) {
        return res.status(400).json({ message: `${f.label} is required` });
      }
    }

    const existing = await prisma.tournamentRegistration.findUnique({
      where: { tournamentId_userId_gameId: { tournamentId, userId: req.user.userId, gameId } }
    });
    if (existing) return res.status(409).json({ message: "Already registered for this game" });

    await prisma.tournamentRegistration.create({
      data: { tournamentId, userId: req.user.userId, gameId, responses, paymentInfo: paymentInfo ?? null }
    });
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    console.error("registerForTournament:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};
