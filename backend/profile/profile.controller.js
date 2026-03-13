import { prisma } from "../db/prisma.js";

/* ================= GET MY PROFILE ================= */

export const getMyProfile = async (req, res) => {
  try {
    let profile = await prisma.playerProfile.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: { select: { id: true, username: true } },
        games: { include: { game: true } },
        socialLinks: true,
        achievements: true
      }
    });
    if (!profile) {
      profile = await prisma.playerProfile.create({
        data: { userId: req.user.userId },
        include: {
          user: { select: { id: true, username: true } }
        }
      });
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

/* ================= UPSERT PROFILE ================= */

export const upsertProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      location,
      gender,
      age,
      about,
      games,
      socialLinks,
      achievements
    } = req.body;

    const profile = await prisma.playerProfile.upsert({
      where: { userId },
      update: { location, gender, age, about },
      create: { userId, location, gender, age, about }
    });

    const ops = [];

    /* ===== PLAYER GAMES ===== */
    if (Array.isArray(games)) {
      ops.push(
        prisma.playerGame.deleteMany({
          where: { profileId: profile.id }
        })
      );

      if (games.length) {
        ops.push(
          prisma.playerGame.createMany({
            data: games.map(g => ({
              profileId: profile.id,
              gameId: g.gameId,            // ✅ REQUIRED
              playerTag: g.playerTag || null,
              isPublic: true
            }))
          })
        );
      }
    }

    /* ===== SOCIAL LINKS ===== */
    if (Array.isArray(socialLinks)) {
      ops.push(
        prisma.socialLink.deleteMany({
          where: { profileId: profile.id }
        })
      );

      if (socialLinks.length) {
        ops.push(
          prisma.socialLink.createMany({
            data: socialLinks.map(s => ({
              profileId: profile.id,
              provider: s.provider || "OTHER",
              url: s.url,
              label: s.label || null
            }))
          })
        );
      }
    }

    /* ===== ACHIEVEMENTS ===== */
    if (Array.isArray(achievements)) {
      ops.push(
        prisma.achievement.deleteMany({
          where: { profileId: profile.id }
        })
      );

      if (achievements.length) {
        ops.push(
          prisma.achievement.createMany({
            data: achievements.map(a => ({
              profileId: profile.id,
              title: a.title,
              description: a.description || null,
              achievedAt: a.achievedAt || null,
              proofUrl: a.proofUrl || null
            }))
          })
        );
      }
    }

    if (ops.length) {
      await prisma.$transaction(ops);
    }

    const fresh = await prisma.playerProfile.findUnique({
      where: { id: profile.id },
      include: {
        user: { select: { id: true, username: true } },
        games: { include: { game: true } },   // 🔑 IMPORTANT
        socialLinks: true,
        achievements: true
      }
    });

    res.json({
      message: "Profile saved successfully",
      profile: fresh
    });

  } catch (err) {
    console.error("upsertProfile:", err);
    res.status(500).json({
      message: "Failed to save profile",
      error: err.message
    });
  }
};

/* ================= SEARCH PROFILES ================= */

export const searchProfiles = async (req, res) => {
  try {
    const { gameId, location, gender, lookingForTeam, username } = req.query;

    const whereProfile = {};

    if (location) {
      whereProfile.location = { contains: location, mode: "insensitive" };
    }

    if (gender) {
      whereProfile.gender = gender;
    }

    if (lookingForTeam !== undefined) {
      whereProfile.lookingForTeam = lookingForTeam === "true";
    }

    const profiles = await prisma.playerProfile.findMany({
      where: {
        ...whereProfile,
        games: gameId
          ? {
            some: { gameId: Number(gameId) }
          }
          : undefined,
        user: username
          ? {
            username: { contains: username, mode: "insensitive" }
          }
          : undefined
      },
      include: {
        user: { select: { id: true, username: true } },
        games: { include: { game: true } },
        socialLinks: true,
        achievements: true
      }
    });

    res.json(profiles);
  } catch (err) {
    console.error("searchProfiles:", err);
    res.status(500).json({ message: "Failed to search profiles" });
  }
};

/* ================= PUBLIC PROFILE ================= */

export const getPublicProfile = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const profile = await prisma.playerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, username: true } },
        games: { include: { game: true } },
        socialLinks: true,
        achievements: true
      }
    });

    if (!profile || profile.visibility === "PRIVATE") {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (err) {
    console.error("getPublicProfile:", err);
    res.status(500).json({ message: "Failed to fetch public profile" });
  }
};
