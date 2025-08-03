const { Job } = require('../models');
const { Op } = require('sequelize');

function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

async function searchJobsByQuery(query) {
  const normalizedQuery = normalizeText(query);

  const jobs = await Job.findAll({
    attributes: ['id', 'title', 'tags', 'location']
  });

  const titleMatches = [];
  const tagMatches = [];

  for (const job of jobs) {
    const title = normalizeText(job.title || '');
    let tags = [];

    try {
      tags = typeof job.tags === 'string' ? JSON.parse(job.tags) : job.tags || [];
    } catch {
      tags = [];
    }

    if (title.includes(normalizedQuery)) {
      titleMatches.push(job);
    } else if (tags.some(tag => normalizeText(tag).includes(normalizedQuery))) {
      tagMatches.push(job);
    }
  }

  return [...titleMatches, ...tagMatches];
}

module.exports = {
  normalizeText,
  searchJobsByQuery
};
