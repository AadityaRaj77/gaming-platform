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
