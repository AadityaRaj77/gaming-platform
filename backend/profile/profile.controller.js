import { prisma } from "../config/db.js";

// GET /api/profile/me
export const getMyProfile = async (req, res) => {
  try {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: req.user.userId },
      include: {
        games: true,
        socialLinks: true,
        achievements: true
      }
    });

    res.json(profile);
  } catch (err) {
    console.error("getMyProfile:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// PUT /api/profile/me
export const upsertProfile = async (req, res) => {
  try {
    const {
      location,
      gender,
      age,
      about,
      hoursPerWeek,
      lookingForTeam,
      availabilityStart,
      availabilityEnd,
      games,         // [{ game, customName?, playerIdOnGame? }]
      socialLinks,   // [{ provider, url, label? }]
      achievements   // [{ title, description?, proofUrl? }]
    } = req.body;

    // 1. Create or update main profile
    const profile = await prisma.playerProfile.upsert({
      where: { userId: req.user.userId },
      update: {
        location,
        gender,
        age,
        about,
        hoursPerWeek,
        lookingForTeam,
        availabilityStart,
        availabilityEnd,
        isProfileComplete: true
      },
      create: {
        userId: req.user.userId,
        location,
        gender,
        age,
        about,
        hoursPerWeek,
        lookingForTeam,
        availabilityStart,
        availabilityEnd,
        isProfileComplete: true
      }
    });

    // 2. Clear old relations
    await prisma.playerGame.deleteMany({ where: { profileId: profile.id } });
    await prisma.socialLink.deleteMany({ where: { profileId: profile.id } });
    await prisma.achievement.deleteMany({ where: { profileId: profile.id } });

    // 3. Re-insert fresh data
    if (games?.length) {
      await prisma.playerGame.createMany({
        data: games.map(g => ({
          profileId: profile.id,
          game: g.game,
          customName: g.customName || null,
          playerIdOnGame: g.playerIdOnGame || null
        }))
      });
    }

    if (socialLinks?.length) {
      await prisma.socialLink.createMany({
        data: socialLinks.map(s => ({
          profileId: profile.id,
          provider: s.provider,
          url: s.url,
          label: s.label || null
        }))
      });
    }

    if (achievements?.length) {
      await prisma.achievement.createMany({
        data: achievements.map(a => ({
          profileId: profile.id,
          title: a.title,
          description: a.description || null,
          proofUrl: a.proofUrl || null
        }))
      });
    }

    res.json({ message: "Profile saved successfully" });
  } catch (err) {
    console.error("upsertProfile:", err);
    res.status(500).json({ message: "Failed to save profile" });
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
        games: true
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
