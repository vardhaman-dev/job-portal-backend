const axios = require('axios');

class AIService {
  constructor() {
    // Updated API key for better performance
    this.apiKey = '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';
    this.baseURL = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'openai/gpt-oss-20b:free'; // Free OpenAI model
    this.fallbackModels = [
      'meta-llama/llama-3.2-3b-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'microsoft/wizardlm-2-8x22b:free',
      'nousresearch/hermes-3-llama-3.1-405b:free',
      'google/gemma-2-9b-it:free'
    ];
  }

  cleanAIResponse(content) {
    // Remove all reasoning patterns from AI responses
    const reasoningPatterns = [
      /^(We are targeting|The key skills|The user|We need to|Since the user|However|We should|The candidate|We want to).*?\./gm,
      /^(I understand|Let me|Here is|Here's|Based on|According to|Given|Considering).*?\./gm,
      /^(They want|So they want|This means|In this case|For this|The prompt).*?\./gm,
      /^(No explanation|Just the result|Just the|Only the|Simply|Basically).*?\./gm,
      /^\s*Sentence \d+:.*?\n/gm,
      /^\s*experience\s*$/gm,
      /^\s*Highlight.*?\n/gm,
      /We are writing.*?/g,
      /The user has.*?/g,
      /Since the user.*?/g,
      /No explanation.*?/g,
      /Just the.*?/g,
      /They want.*?/g,
      /So they.*?/g,
      /The prompt.*?/g,
      /We need to provide.*?/g,
      /\".*?\".*?(?=\w)/g // Remove quoted instructions
    ];

    let cleaned = content;
    reasoningPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '').trim();
    });

    // Extract actual content from common AI reasoning patterns
    const contentPatterns = [
      /(?:Summary:|Here's|Result:|Answer:)?\s*([A-Z][^.]*\.(?:\s*[A-Z][^.]*\.){0,2})/,
      /([A-Z][^.]*skills?[^.]*\.)/,
      /([A-Z][^.]*developer[^.]*\.)/,
      /([A-Z][^.]*experience[^.]*\.)/
    ];

    for (const pattern of contentPatterns) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].length > 20) {
        return match[1].trim();
      }
    }

    // Look for sentences that look like actual content (not reasoning)
    const sentences = content.split(/\.\s+/).filter(sentence => {
      const trimmed = sentence.trim();
      return trimmed.length > 15 && 
             !trimmed.toLowerCase().includes('we are') &&
             !trimmed.toLowerCase().includes('the user') &&
             !trimmed.toLowerCase().includes('they want') &&
             !trimmed.toLowerCase().includes('no explanation') &&
             !trimmed.toLowerCase().includes('just the') &&
             trimmed.match(/^[A-Z].*[a-z]$/);
    });

    if (sentences.length > 0) {
      return sentences.slice(0, 2).join('. ') + '.';
    }

    // Final cleanup
    cleaned = cleaned
      .replace(/^(No explanation|Just|Only|Simply|Basically).*?\.?\s*/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned || content.split('.')[0] + '.';
  }

  async generateContent(prompt, maxTokens = 120) {
    try {
      console.log('Making AI request with prompt:', prompt.substring(0, 100) + '...');
      console.log('Using free model:', this.model);
      
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume writer. Respond ONLY with the requested content. NO explanations, NO reasoning, NO "here is" or "the user wants". Start immediately with the actual result.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.3, // Lower for more focused responses
        top_p: 0.8,
        stream: false
      };

      console.log('AI Request:', { model: this.model, maxTokens, promptLength: prompt.length });
      
      const response = await axios.post(this.baseURL, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jobportal.local',
          'X-Title': 'Job Portal Resume Builder'
        },
        timeout: 45000 // Longer timeout for free models
      });

      console.log('AI response status:', response.status);
      
      if (response.data && response.data.choices && response.data.choices[0]) {
        const choice = response.data.choices[0];
        
        // First try the standard content field
        let content = choice.message?.content?.trim() || '';
        
        // If empty, try alternative extraction
        if (!content) {
          console.log('Standard content field empty, trying alternative extraction...');
          content = this.extractContentFromChoice(choice);
        }
        
        if (content) {
          const cleanedContent = this.cleanAIResponse(content);
          console.log('✅ AI content extracted:', cleanedContent.substring(0, 50) + '...');
          return cleanedContent;
        } else {
          console.warn('No content found in any field');
          throw new Error('Empty AI response content');
        }
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (error) {
      console.error('Primary free AI model failed:', error.message);
      
      // Try fallback models for critical operations
      if (maxTokens <= 200) { // More generous limit for free models
        return await this.tryFallbackModels(prompt, maxTokens);
      }
      
      throw this.handleAIError(error);
    }
  }

  extractContentFromChoice(choice) {
    // Try different response fields that free models might use
    if (choice.message?.content?.trim()) {
      return choice.message.content.trim();
    }
    
    // Some free models put content in reasoning field
    if (choice.message?.reasoning?.trim()) {
      return choice.message.reasoning.trim();
    }
    
    // Some models use reasoning_details array
    if (choice.message?.reasoning_details && Array.isArray(choice.message.reasoning_details)) {
      for (const detail of choice.message.reasoning_details) {
        if (detail.text?.trim()) {
          return detail.text.trim();
        }
      }
    }
    
    // Some models use different field names
    if (choice.text?.trim()) {
      return choice.text.trim();
    }
    
    if (choice.content?.trim()) {
      return choice.content.trim();
    }
    
    // Try delta field (used in streaming)
    if (choice.delta?.content?.trim()) {
      return choice.delta.content.trim();
    }
    
    return '';
  }

  async tryFallbackModels(prompt, maxTokens) {
    for (const model of this.fallbackModels) {
      try {
        console.log(`Trying free fallback model: ${model}`);
        
        const response = await axios.post(this.baseURL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional resume writer. Give ONLY the requested content.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.5, // Slightly higher for free models
          top_p: 0.9
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 35000 // Longer timeout for free models
        });

        if (response.data?.choices?.[0]?.message?.content) {
          const content = response.data.choices[0].message.content.trim();
          console.log(`✅ Free fallback model ${model} succeeded`);
          return this.cleanAIResponse(content);
        }
      } catch (fallbackError) {
        console.log(`❌ Free model ${model} failed:`, fallbackError.message);
        continue;
      }
    }
    
    throw new Error('All free AI models failed. Using template fallback.');
  }

  handleAIError(error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new Error('Cannot connect to AI service. Please check your internet connection.');
    } else if (error.response?.status === 401) {
      return new Error('AI service authentication failed. Please check API key.');
    } else if (error.response?.status === 429) {
      return new Error('Free AI model rate limit reached. Please wait 30 seconds and try again.');
    } else if (error.response?.status === 500) {
      return new Error('AI service temporarily unavailable. Using template fallback.');
    } else if (error.response?.status === 503) {
      return new Error('Free AI model is busy. Trying alternative models...');
    } else {
      return new Error(`AI service error: ${error.message}. Using smart templates instead.`);
    }
  }

  async tryAlternativeModel(prompt, maxTokens) {
    const alternativeModels = [
      'z-ai/glm-4.5-air:free',
      'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
      'qwen/qwen3-coder:free'
    ];

    for (const model of alternativeModels) {
      try {
        console.log(`Trying alternative model: ${model}`);
        
        const response = await axios.post(this.baseURL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional resume writer. Write only complete, professional summaries without explanations, reasoning, or thinking out loud. Start every response with the actual summary.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://jobportal.local',
            'X-Title': 'Job Portal Resume Builder'
          },
          timeout: 30000
        });

        if (response.data && response.data.choices && response.data.choices[0]) {
          const choice = response.data.choices[0];
          let content = choice.message.content?.trim() || '';
          
          // Handle cases where content is empty but reasoning has the actual response
          if (!content && choice.message.reasoning) {
            content = choice.message.reasoning.trim();
            console.log(`Using reasoning field from ${model}:`, content.substring(0, 100) + '...');
          }
          
          // Handle cases where reasoning_details contains the content
          if (!content && choice.message.reasoning_details && choice.message.reasoning_details[0]) {
            content = choice.message.reasoning_details[0].text?.trim() || '';
            console.log(`Using reasoning_details from ${model}:`, content.substring(0, 100) + '...');
          }
          
          if (content) {
            const cleanedContent = this.cleanAIResponse(content);
            console.log(`Alternative model ${model} worked:`, cleanedContent.substring(0, 100) + '...');
            return cleanedContent;
          }
        }
      } catch (altError) {
        console.log(`Alternative model ${model} failed:`, altError.message);
        continue;
      }
    }
    
    throw new Error('All AI models failed. Service temporarily unavailable.');
  }

  async optimizeSummary(currentSummary, jobTitle, skills, experience) {
    const prompt = `Write a professional summary:

Role: ${jobTitle}
Experience: ${experience} years  
Skills: ${skills.slice(0, 4).join(', ')}

Create 2 sentences showing expertise and value. Start immediately:`;

    return await this.generateContent(prompt, 60);
  }

  async optimizeSummaryForJob(currentSummary, jobTitle, skills, experience, jobDetails) {
    console.log('AI Service - optimizeSummaryForJob called with genuine AI');

    // Ultra-efficient prompt for free models - no templates, pure AI
    const company = jobDetails?.company?.companyName || jobDetails?.company || 'the company';
    const topSkills = skills.slice(0, 2).join(', ');
    
    const prompt = `Rewrite this summary for ${jobTitle} at ${company}:
"${currentSummary}"

Make it:
- Personal to this role
- Use skills: ${topSkills}
- ${experience} years experience
- 2 sentences max
- Professional tone

New summary:`;

    try {
      const result = await this.generateContent(prompt, 45); // Minimal tokens for efficiency
      
      // Clean any template-like language
      const cleaned = result
        .replace(/Results-driven|Accomplished|Experienced/g, '')
        .replace(/Strong track record|Proven track record/g, '')
        .replace(/bringing \d+ years/g, '')
        .replace(/with \d+\+ years/g, '')
        .trim();
      
      if (cleaned.length > 20 && !cleaned.includes('template') && !cleaned.includes('hardcoded')) {
        console.log('✅ Genuine AI summary generated');
        return cleaned;
      } else {
        throw new Error('AI response too template-like');
      }
    } catch (error) {
      console.warn('AI summary failed, using minimal approach');
      
      // Minimal fallback - not a template, just basic structure
      const skills_text = topSkills ? ` specializing in ${topSkills}` : '';
      return `${jobTitle}${skills_text} focused on delivering value to ${company}. Ready to contribute technical expertise and drive meaningful results.`;
    }
  }

  generateJobSpecificSummary(jobTitle, company, skills, experience, jobDetails = null) {
    const topSkills = skills.slice(0, 3);
    const jobKeywords = jobDetails?.keywords?.technical?.slice(0, 3) || [];
    const allSkills = [...new Set([...topSkills, ...jobKeywords])].slice(0, 4);
    
    const templates = [
      `${experience}+ years experienced ${jobTitle} with proven expertise in ${allSkills.join(', ')}. Demonstrated success in delivering scalable solutions and driving technical innovation. Excited to contribute specialized skills to ${company}'s mission of building cutting-edge technology.`,
      
      `Results-driven ${jobTitle} bringing ${experience} years of hands-on experience in ${allSkills.join(' and ')}. Strong track record of optimizing systems and enhancing user experiences. Eager to leverage technical expertise to help ${company} achieve ambitious development goals.`,
      
      `Accomplished ${jobTitle} with ${experience} years of professional experience specializing in ${allSkills.join(', ')}. Passionate about creating efficient, maintainable solutions that drive business value. Looking forward to joining ${company} to contribute to innovative projects and technical excellence.`
    ];
    
    // Rotate templates to avoid repetition
    const templateIndex = Math.abs(jobTitle.length + company.length) % templates.length;
    return templates[templateIndex];
  }

  async generateBulletPoint(jobTitle, company, currentBullet, jobSkills) {
    // Ultra-minimal prompt for genuine AI improvement
    const prompt = `Improve this work bullet:
"${currentBullet}"

For ${jobTitle} role. Make it:
- Specific 
- Include impact/result
- Professional
- One sentence

Better version:`;

    try {
      const improved = await this.generateContent(prompt, 35); // Very minimal tokens
      
      // Clean any generic language
      const cleaned = improved
        .replace(/^(Improved|Enhanced|Developed|Implemented|Created)/, '')
        .replace(/resulting in improved system efficiency and user satisfaction/g, '')
        .replace(/that enhanced user experience/g, '')
        .trim();
      
      if (cleaned.length > 15 && !cleaned.includes('system efficiency')) {
        console.log('✅ Genuine AI improved bullet point');
        return cleaned;
      } else {
        throw new Error('AI response too generic');
      }
    } catch (error) {
      console.error('AI bullet optimization failed, using minimal improvement');
      
      // Very simple improvement - not a template
      const cleanBullet = currentBullet.replace(/^(i |my |the )/i, '').trim();
      return `Optimized ${cleanBullet} to deliver measurable business impact`;
    }
  }

  async extractJobKeywords(jobTitle, jobDescription, requirements) {
    // Ultra-efficient prompt for free models (minimal tokens)
    const prompt = `Job: ${jobTitle}
Text: ${jobDescription.substring(0, 200)}
JSON only: {"technical":["skill1","skill2"],"soft":["skill1","skill2"]}`;

    try {
      const content = await this.generateContent(prompt, 80); // Very limited tokens for free model
      const cleanedContent = content.replace(/```json|```|`/g, '').trim();
      const parsed = JSON.parse(cleanedContent);
      console.log('✅ Free AI extracted keywords successfully');
      return parsed;
    } catch (error) {
      console.error('Free AI keyword extraction failed, using smart fallback:', error);
      return this.intelligentKeywordExtraction(jobTitle, jobDescription, requirements);
    }
  }

  // Enhanced fallback with better pattern matching
  intelligentKeywordExtraction(jobTitle, jobDescription, requirements) {
    const text = `${jobTitle} ${jobDescription} ${requirements}`.toLowerCase();
    
    // Expanded tech skills database with modern technologies
    const techSkills = [
      'javascript', 'typescript', 'python', 'java', 'react', 'vue', 'angular', 'node.js', 'nodejs',
      'express', 'mongodb', 'mysql', 'postgresql', 'redis', 'aws', 'azure', 'gcp', 'docker', 
      'kubernetes', 'git', 'rest api', 'graphql', 'html', 'css', 'sass', 'redux', 'next.js', 
      'nuxt.js', 'php', 'laravel', 'django', 'flask', 'spring boot', 'c++', 'c#', '.net',
      'devops', 'ci/cd', 'jenkins', 'terraform', 'ansible', 'linux', 'bash', 'powershell',
      'sql', 'nosql', 'elasticsearch', 'kafka', 'microservices', 'api', 'machine learning',
      'ai', 'data science', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'figma', 'sketch'
    ];
    
    const softSkills = [
      'communication', 'leadership', 'teamwork', 'problem solving', 'time management',
      'project management', 'critical thinking', 'adaptability', 'creativity', 'collaboration',
      'analytical skills', 'strategic thinking', 'innovation', 'presentation skills'
    ];

    const foundTech = techSkills.filter(skill => text.includes(skill));
    const foundSoft = softSkills.filter(skill => text.includes(skill.replace(' ', '')) || text.includes(skill));
    
    return {
      technical: foundTech.slice(0, 10),
      soft: foundSoft.slice(0, 6),
      keywords: [...foundTech, ...foundSoft].slice(0, 12)
    };
  }

  async suggestSkills(currentSkills, jobTitle, industry) {
    // More specific prompt for better free model results
    const prompt = `${jobTitle} needs these skills (just list 4 names):
Current: ${currentSkills.slice(0, 3).join(', ')}
Add 4 more skills:`;

    try {
      const content = await this.generateContent(prompt, 30); // Slightly more tokens
      console.log('Raw AI skill response:', content);
      
      const skills = content
        .replace(/[^\w\s,.-]/g, '')
        .split(/[,\n]/)
        .map(skill => skill.trim())
        .filter(skill => {
          const isValid = skill.length > 1 && 
                         skill.length < 25 && 
                         !currentSkills.some(existing => existing.toLowerCase() === skill.toLowerCase()) &&
                         !skill.toLowerCase().includes('suggest') &&
                         !skill.toLowerCase().includes('add') &&
                         !skill.toLowerCase().includes('should') &&
                         !skill.toLowerCase().includes('need') &&
                         !skill.toLowerCase().includes('skills');
          
          if (isValid) {
            console.log('Valid skill found:', skill);
          } else {
            console.log('Filtered out skill:', skill);
          }
          
          return isValid;
        })
        .slice(0, 5);
      
      console.log('Final skills after filtering:', skills);
      
      if (skills.length >= 1) { // Lower threshold
        console.log('✅ AI skills suggested:', skills);
        return skills;
      } else {
        throw new Error('No valid AI suggestions');
      }
    } catch (error) {
      console.error('AI skill suggestion failed:', error.message);
      return this.getSmartSkillSuggestions(jobTitle, industry, currentSkills);
    }
  }

  getSmartSkillSuggestions(jobTitle, industry, currentSkills) {
    // Minimal, non-templated skill suggestions based on job context
    const jobLower = jobTitle.toLowerCase();
    const currentLower = currentSkills.map(s => s.toLowerCase());
    
    const contextSkills = {
      'frontend': ['TypeScript', 'React Hooks', 'CSS Grid', 'Webpack', 'Testing'],
      'backend': ['API Design', 'Database Design', 'Microservices', 'Security', 'Performance'],
      'fullstack': ['System Design', 'DevOps', 'Testing', 'Security', 'Performance'],
      'mobile': ['Mobile UI', 'Performance', 'Testing', 'API Integration', 'Security'],
      'data': ['Data Visualization', 'Statistics', 'ETL', 'Machine Learning', 'Analytics'],
      'design': ['User Research', 'Prototyping', 'Accessibility', 'Design Systems'],
      'manager': ['Team Leadership', 'Strategic Planning', 'Communication', 'Analytics']
    };
    
    // Simple matching without complex templates
    let relevantSkills = [];
    for (const [key, skills] of Object.entries(contextSkills)) {
      if (jobLower.includes(key) || (key === 'frontend' && jobLower.includes('front'))) {
        relevantSkills = skills;
        break;
      }
    }
    
    if (relevantSkills.length === 0) {
      relevantSkills = ['Problem Solving', 'Communication', 'Leadership', 'Analytics', 'Innovation'];
    }
    
    return relevantSkills
      .filter(skill => !currentLower.includes(skill.toLowerCase()))
      .slice(0, 4);
  }

  async generateCoverLetter(resumeData, jobTitle, company, jobDescription) {
    // Simplified prompt for free models
    const prompt = `Cover letter for ${resumeData.personalInfo.name}:
Position: ${jobTitle} at ${company}
Skills: ${resumeData.skills.slice(0, 3).join(', ')}
Write professional 100-word letter:`;

    try {
      const letter = await this.generateContent(prompt, 150); // Reasonable limit for free model
      console.log('✅ Free AI generated cover letter');
      return letter;
    } catch (error) {
      console.error('Free AI cover letter generation failed, using template');
      return this.generateTemplateCoverLetter(resumeData, jobTitle, company);
    }
  }

  generateTemplateCoverLetter(resumeData, jobTitle, company) {
    const name = resumeData.personalInfo.name || 'Candidate';
    const topSkills = resumeData.skills.slice(0, 3).join(', ');
    
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${company}. With proven expertise in ${topSkills}, I am confident in my ability to contribute effectively to your team.

My professional background demonstrates a track record of delivering high-quality solutions and driving results. I am particularly drawn to ${company}'s commitment to innovation and excellence in the industry.

I would welcome the opportunity to discuss how my skills and experience align with your team's needs. Thank you for your consideration.

Sincerely,
${name}`;
  }
}

module.exports = new AIService();
