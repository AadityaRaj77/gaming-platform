import { prisma } from "../config/db.js";

// GET /api/profile/me
export const getMyProfile = async (req, res) => {
  try {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: {
          select: { id: true, username: true }
        },
        games: true,
        socialLinks: true,
        achievements: true
      }
    });

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load profile" });
  }
};


// PUT /api/profile/me
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

    // Base profile
    const profile = await prisma.playerProfile.upsert({
      where: { userId },
      update: { location, gender, age, about },
      create: { userId, location, gender, age, about }
    });

    const ops = [];

    //  PlayerGame (ENUM SAFE)
    if (Array.isArray(games)) {
      ops.push(
        prisma.playerGame.deleteMany({ where: { profileId: profile.id } })
      );

      if (games.length) {
        ops.push(
          prisma.playerGame.createMany({
            data: games.map(g => ({
              profileId: profile.id,
              game: g.game, // MUST match enum exactly
              customName: g.customName || null,
              playerIdOnGame: g.playerIdOnGame || null
            }))
          })
        );
      }
    }

    // Social Links (PROVIDER IS MANDATORY)
    if (Array.isArray(socialLinks)) {
      ops.push(
        prisma.socialLink.deleteMany({ where: { profileId: profile.id } })
      );

      if (socialLinks.length) {
        ops.push(
          prisma.socialLink.createMany({
            data: socialLinks.map(s => ({
              profileId: profile.id,
              provider: s.provider || "OTHER", // ✅ REQUIRED BY SCHEMA
              url: s.url,
              label: s.label || null
            }))
          })
        );
      }
    }

    //  Achievements (TITLE REQUIRED)
    if (Array.isArray(achievements)) {
      ops.push(
        prisma.achievement.deleteMany({ where: { profileId: profile.id } })
      );

      if (achievements.length) {
        ops.push(
          prisma.achievement.createMany({
            data: achievements.map(a => ({
              profileId: profile.id,
              title: a.title,  // ✅ REQUIRED
              description: a.description || null,
              achievedAt: a.achievedAt || null,
              proofUrl: a.proofUrl || null
            }))
          })
        );
      }
    }

    //  Atomic execution
    if (ops.length) {
      await prisma.$transaction(ops);
    }

    // Return fresh profile
    const fresh = await prisma.playerProfile.findUnique({
      where: { id: profile.id },
      include: {
        user: { select: { id: true, username: true } },
        games: true,
        socialLinks: true,
        achievements: true
      }
    });

    res.json({ message: "Profile saved successfully", profile: fresh });

  } catch (err) {
    console.error("upsertProfile:", err);
    res.status(500).json({
      message: "Failed to save profile",
      error: err.message
    });
  }
};







// GET /api/profile/search?username=adi&game=VALORANT&location=Roorkee
export const searchProfiles = async (req, res) => {
  try {
    const { game, location, gender, lookingForTeam, username } = req.query;

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

    const whereGame = game
      ? {
          some: {
            game: game
          }
        }
      : undefined;

    const profiles = await prisma.playerProfile.findMany({
      where: {
        ...whereProfile,
        games: whereGame,
        user: username
          ? {
              username: { contains: username, mode: "insensitive" }
            }
          : undefined
      },
      include: {
        user: {
          select: { id: true, username: true }
        },
        games: true,
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
// GET /api/profile/public/:userId
export const getPublicProfile = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const profile = await prisma.playerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, username: true }
        },
        games: true,
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
