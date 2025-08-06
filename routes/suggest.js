const express = require("express");
const router = express.Router();
const { sequelize } = require("../config/database");

router.get("/suggest/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1. Get user skills
    const userResult = await sequelize.query(
      "SELECT skills_json FROM job_seeker_profiles WHERE user_id = ?",
      { replacements: [userId], type: sequelize.QueryTypes.SELECT }
    );

    if (!userResult.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const userSkills = JSON.parse(userResult[0].skills_json || "[]");
    console.log("Raw skills from DB:", userResult[0].skills_json);

    if (!Array.isArray(userSkills) || userSkills.length === 0) {
      return res.status(400).json({ error: "User has no skills listed" });
    }

    // 2. Get jobs (with skills and tags)
    const jobs = await sequelize.query(
      "SELECT id, title, tags, location, skills FROM jobs WHERE status = 'open'",
      { type: sequelize.QueryTypes.SELECT }
    );

    const normalize = str => str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    const tokenize = str => normalize(str).split(/\s+/);

    const computeMatch = (userSkills, jobTags, title = "") => {
      const userSet = new Set(userSkills.map(normalize));
      const jobSet = new Set([
        ...jobTags.map(normalize),
        ...tokenize(title).filter(word => word.length > 2)
      ]);
      const matches = [...userSet].filter(skill => jobSet.has(skill));
      const score = (2 * matches.length) / (userSet.size + jobSet.size);
      return +score.toFixed(2);
    };

    const suggestions = jobs.map(job => {
      let jobTags = [];

      // Attempt to parse tags
      try {
        const parsed = JSON.parse(job.tags || "[]");
        if (Array.isArray(parsed)) jobTags = parsed;
      } catch {
        jobTags = [];
      }

      // Fallback to skills if tags are empty
      if (jobTags.length === 0 && job.skills) {
        try {
          const parsedSkills = JSON.parse(job.skills);
          if (Array.isArray(parsedSkills)) {
            jobTags = parsedSkills;
          } else {
            if (typeof job.skills === "string") {
  jobTags = job.skills.split(',').map(s => s.trim());
} else if (Array.isArray(job.skills)) {
  jobTags = job.skills;
} else {
  jobTags = [];
}

          }
        } catch {
          if (typeof job.skills === "string") {
  jobTags = job.skills.split(',').map(s => s.trim());
} else if (Array.isArray(job.skills)) {
  jobTags = job.skills;
} else {
  jobTags = [];
}

        }
      }

      const match = computeMatch(userSkills, jobTags, job.title);

      return {
        jobId: job.id,
        title: job.title,
        location: job.location || "N/A",
        match
      };
    });

    suggestions.sort((a, b) => b.match - a.match);
    const topSuggestions = suggestions.filter(s => s.match > 0).slice(0, 5);

    if (topSuggestions.length < 5) {
      const fallback = suggestions.filter(s => s.match === 0).slice(0, 5 - topSuggestions.length);
      topSuggestions.push(...fallback);
    }

    res.json(topSuggestions);
  } catch (err) {
    console.error("Suggestion error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
