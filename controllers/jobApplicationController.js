const { JobApplication, Job, User } = require('../models');

// Apply to a job
exports.applyToJob = async (req, res) => {
  try {
    const { job_id, cover_letter, resume_link } = req.body;
    const job_seeker_id = req.user.id;

    // Check if job exists
    const job = await Job.findByPk(job_id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Prevent duplicate applications
    const existing = await JobApplication.findOne({ where: { job_id, job_seeker_id } });
    if (existing) return res.status(400).json({ success: false, message: 'Already applied to this job' });

    const application = await JobApplication.create({
      job_id,
      job_seeker_id,
      cover_letter,
      resume_link,
      status: 'applied',
      applied_at: new Date()
    });
    res.status(201).json({ success: true, application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to apply to job' });
  }
};

// Get all applications for the logged-in job seeker
exports.getMyApplications = async (req, res) => {
  try {
    const job_seeker_id = req.user.id;
    const applications = await JobApplication.findAll({
      where: { job_seeker_id },
      include: [{ model: Job, as: 'job' }]
    });
    res.json({ success: true, applications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};
