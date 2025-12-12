import { prisma } from "../config/db.js";

export const createTournament = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      tagline,
      venueType,
      location,
      startDate,
      endDate,
      feeType,
      feeAmount,
      games,
      requirements,
      bannerUrl,
      organizers, 
    } = req.body;

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name,
        tagline,
        venueType,
        location: venueType === "OFFLINE" ? location : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: userId,
        feeType,
        feeAmount: feeType === "PAID" ? Number(feeAmount) : null,
        bannerUrl,

        games: {
          create: games.map((g) => ({ game: g })),
        },

        requirements: {
          create: requirements.map((text) => ({
            text,
          })),
        },

        organizers: {
          create: [{ userId }] // creator always an organizer
        },
      },
    });

    // add other organizers by username
    if (organizers?.length) {
      const users = await prisma.user.findMany({
        where: { username: { in: organizers } }
      });

      await prisma.tournamentOrganizer.createMany({
        data: users.map((u) => ({
          userId: u.id,
          tournamentId: tournament.id,
        })),
      });
    }

    res.json({ message: "Tournament created", tournamentId: tournament.id });
  } catch (err) {
    console.error("createTournament error:", err);
    res.status(500).json({ message: "Failed to create tournament" });
  }
};



export const getTournamentById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.userId;

    const data = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizers: {
          include: { user: true },
        },
        games: true,
        requirements: true,
      },
    });

    if (!data) return res.status(404).json({ message: "Tournament not found" });

    const isOrganizer = data.organizers.some((o) => o.userId === userId);

    res.json({ ...data, isOrganizer });
  } catch (err) {
    console.error("getTournamentById", err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};


export const getMyOrganizedTournaments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const tournaments = await prisma.tournamentOrganizer.findMany({
      where: { userId },
      include: { tournament: true },
    });

    res.json(tournaments.map((t) => t.tournament));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
};



export const disbandTournament = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.userId;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) return res.status(404).json({ message: "Not found" });
    if (tournament.createdBy !== userId)
      return res.status(403).json({ message: "Only creator can disband" });

    await prisma.tournament.delete({ where: { id } });

    res.json({ message: "Tournament disbanded" });
  } catch (err) {
    console.error("disband:", err);
    res.status(500).json({ message: "Failed to disband" });
  }
};



export const exitTournament = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    await prisma.tournamentOrganizer.deleteMany({
      where: { userId, tournamentId: id },
    });

    res.json({ message: "Left tournament" });
  } catch (err) {
    console.error("exitTournament:", err);
    res.status(500).json({ message: "Failed to exit" });
  }
};



export const addRoom = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    const room = await prisma.tournamentRoom.create({
      data: {
        name,
        tournamentId: id,
      },
    });

    res.json({ message: "Room created", room });
  } catch (err) {
    console.error("addRoom:", err);
    res.status(500).json({ message: "Room create failed" });
  }
};
