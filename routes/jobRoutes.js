const express = require('express');
const router = express.Router();
const { Job } = require('../models');
const CompanyProfile = require('../models/CompanyProfile');
const { searchJobsByQuery } = require('../controllers/jobSearchService');


const CATEGORIES_TAGS = {
  "Information Technology": [
    "it", "software", "developer", "engineer", "technology", "java", "python", "cloud",
    "data", "frontend", "backend", "react", "nodejs", "algorithms", "ml", "devops", "fullstack", "cybersecurity"
  ],

  "Marketing & Sales": [
    "marketing", "sales", "seo", "content", "branding", "digital", "customer", "lead",
    "campaign", "ads", "email", "social", "market research", "copywriting", "crm"
  ],

  "Finance & Accounting": [
    "finance", "accounting", "audit", "tax", "budget", "investment", "ledger", "payroll",
    "compliance", "invoicing", "financial analysis", "forecasting", "bookkeeping"
  ],

  "Human Resources": [
    "hr", "recruitment", "talent", "training", "employee", "relations", "onboarding",
    "payroll", "benefits", "performance", "hrms", "retention"
  ],

  "Business & Consulting": [
    "business", "consulting", "strategy", "management", "operations", "project",
    "analysis", "planning", "market research", "client", "solution design", "pmo"
  ],

  "Design & Creative": [
    "design", "creative", "graphics", "ui", "ux", "illustrator", "photoshop",
    "branding", "motion", "animation", "figma", "adobe", "wireframe", "prototyping"
  ],

  "Legal & Compliance": [
    "legal", "compliance", "contract", "law", "risk", "regulations", "policy",
    "attorney", "litigation", "intellectual property", "corporate law", "legal research"
  ],

  "Healthcare & Medical": [
    "healthcare", "medical", "nurse", "doctor", "clinic", "pharma", "patient",
    "public health", "hospital", "clinical", "lab", "radiology", "diagnosis",
    "physiotherapy", "medical assistant", "health informatics", "epidemiology", "emt", "biotech"
  ]
};
const normalize = (str) => str.toLowerCase().trim();

function assignCategory(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  const normalizedTags = tags.map(normalize);
  let bestCategory = null;
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(CATEGORIES_TAGS)) {
    const normalizedKeywords = keywords.map(normalize);
    const matches = normalizedTags.filter(tag => normalizedKeywords.includes(tag)).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  }

  return maxMatches > 0 ? bestCategory : null;
}

// GET /jobs → Fetch all jobs
router.get('/jobs', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, location, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereConditions = {
      status: 'open' // Only show open jobs
    };

    // Add filters if provided
    if (category) {
      whereConditions.category = category;
    }
    if (location) {
      whereConditions.location = { [require('sequelize').Op.iLike]: `%${location}%` };
    }
    if (type) {
      whereConditions.type = type;
    }

    const jobs = await Job.findAndCountAll({
      where: whereConditions,
      include: [{
        model: CompanyProfile,
        as: 'company',
        attributes: [
          'companyName',
          'logo',
          'website',
          'description',
          'industry',
          'location'
        ]
      }],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    // Parse JSON strings for each job
    const jobsWithParsedData = jobs.rows.map(job => {
      const jobData = job.toJSON();
      
      // Parse skills and tags from string to array
      try {
        if (typeof jobData.skills === 'string') {
          jobData.skills = JSON.parse(jobData.skills);
        }
      } catch {
        jobData.skills = [];
      }

      try {
        if (typeof jobData.tags === 'string') {
          jobData.tags = JSON.parse(jobData.tags);
        }
      } catch {
        jobData.tags = [];
      }

      return jobData;
    });

    res.json({
      success: true,
      jobs: jobsWithParsedData,
      totalJobs: jobs.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(jobs.count / parseInt(limit))
    });
  } catch (err) {
    console.error('Error fetching jobs:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
});

router.post('/jobs', async (req, res) => {
  const {
  title, description, location, type, salary,
  deadline, skills, status, company_id, tags,
  benefits, education        
} = req.body;

  // Assign category
  const category = assignCategory(tags);

  try {
   const newJob = await Job.create({
  company_id,
  title,
  description,
  location,
  type,
  salary_range: salary,
  deadline,                 // ✅
  benefits,
  education,   
  status: 'open',
  skills: JSON.stringify(skills || []),  // <--- stringified
  tags: JSON.stringify(tags || []),      // <--- stringified
  category
});


    res.status(201).json({ success: true, jobId: newJob.id, category });
  } catch (err) {
    console.error('Sequelize Insert Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


// GET /search?q=developer → Search jobs
router.get('/search', async (req, res) => {
  const query = req.query.q || '';
  try {
    const results = await searchJobsByQuery(query);
    res.json({ success: true, jobs: results });
  } catch (err) {
    console.error('Search Error:', err.message);
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
});

router.get('/jobs/:id', async (req, res) => {
  const jobId = req.params.id;

  try {
    const job = await Job.findOne({
      where: { id: jobId },
      include: [{
        model: CompanyProfile,
        as: 'company',
        attributes: [
          'companyName',
          'logo',
          'website',
          'description',
          'industry',
          'location'
        ]
      }]
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const jobData = job.toJSON();

    // Parse TEXT → JSON
    try {
      if (typeof jobData.skills === 'string') {
  try {
    jobData.skills = JSON.parse(jobData.skills);
  } catch {
    jobData.skills = [];
  }
}

    } catch { jobData.skills = []; }

    try {
      if (typeof jobData.tags === 'string') {
  try {
    jobData.tags = JSON.parse(jobData.tags);
  } catch {
    jobData.tags = [];
  }
}

     
    } catch { jobData.tags = []; }

    res.json({ success: true, job: jobData });
  } catch (err) {
    console.error('Error fetching job:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
module.exports = router;
