// @ts-ignore - Deno specific import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for regex-based fallback extraction
function extractNameWithRegex(text: string): string {
  // Look for name patterns at the beginning of text or common resume patterns
  const namePatterns = [
    // Pattern: Name at the very top (usually first few lines) - most reliable
    /^(?:[A-Z][a-z'-]+\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?)/m,
    // Pattern: Name with common title prefixes
    /(?:Name|Full Name|Candidate Name):\s*([A-Z][a-z'-]+\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?)/i,
    // Pattern: Two consecutive capitalized words (common name pattern)
    /\b([A-Z][a-z'-]+\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?)\b(?=\s*(?:\n|\r|$|Email|Phone|Contact|@))/,
    // Pattern: Name in email signature pattern
    /(?:Best regards|Sincerely|Regards),\s*\n*([A-Z][a-z'-]+\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?)/mi,
    // Pattern: Name after contact info
    /(?:Contact|About Me):\s*\n*([A-Z][a-z'-]+\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?)/mi
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter out common non-name words and fake names
      const fakeNames = ['john doe', 'jane doe', 'john smith', 'jane smith', 'jaden smith'];
      const lowerName = name.toLowerCase();
      
      if (!fakeNames.includes(lowerName) && 
          !/\b(resume|cv|curriculum|vitae|application|profile|contact|information|summary|objective|experience|education|skills|projects|certifications|awards|interests|references|linkedin|github|portfolio)\b/i.test(name) &&
          name.length > 3 && name.length < 50 &&
          /[A-Z]/.test(name) && // Contains at least one capital letter
          /[a-z]/.test(name)) { // Contains at least one lowercase letter
        return name;
      }
    }
  }
  return '';
}

function extractEmailWithRegex(text: string): string {
  // Comprehensive email regex pattern with validation
  const emailPatterns = [
    // Standard email pattern
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/,
    // Email with common TLDs
    /\b([a-zA-Z0-9._%+-]+@(?:gmail|yahoo|outlook|hotmail|icloud|protonmail|company|org)\.[a-zA-Z]{2,})\b/i,
    // Email in contact info section
    /(?:Email|E-mail|Mail):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
  ];

  for (const pattern of emailPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const email = match[1].trim().toLowerCase();
      // Filter out fake/example emails
      const fakeEmails = ['example@email.com', 'test@email.com', 'sample@email.com', 'user@email.com', 'admin@email.com', 'contact@email.com', 'info@email.com', 'hello@email.com', 'world@email.com'];
      
      if (!fakeEmails.includes(email) && 
          !email.includes('example') && 
          !email.includes('test') && 
          !email.includes('sample') &&
          email.length > 5 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return email;
      }
    }
  }
  return '';
}

function extractPhoneWithRegex(text: string): string {
  // Comprehensive phone regex patterns
  const phonePatterns = [
    // (123) 456-7890
    /\(\d{3}\)\s*\d{3}[-\s]?\d{4}/,
    // 123-456-7890
    /\d{3}[-\s]?\d{3}[-\s]?\d{4}/,
    // +1 123 456 7890
    /\+?\d{1,3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{4}/,
    // 123.456.7890
    /\d{3}\.\d{3}\.\d{4}/
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return '';
}

function extractRoleWithRegex(text: string): string {
  // Common job title/role patterns
  const rolePatterns = [
    // Pattern: Professional Summary section
    /(?:Professional Summary|Summary|Objective|Career Objective|Profile|About Me):\s*([^\n\r]+)/i,
    // Pattern: Job title at the top (after name)
    /^(?:[A-Z][a-z'-]+\s+[A-Z][a-z'-]+\s*)+[\n\r]+\s*([^\n\r]{5,50})/m,
    // Pattern: Experience section titles
    /(?:Work Experience|Experience|Employment History|Professional Experience):[^\n]*[\n\r]+\s*([^\n\r]+?)(?:\s*[\n\r]|\s*at|\s*with|\s*for)/i,
    // Pattern: Current role in experience section
    /(?:Current|Present|Recent)[^\n]*[\n\r]+\s*([^\n\r]{5,50}?)(?:\s*[\n\r]|\s*at|\s*with|\s*for)/i,
    // Pattern: Common tech role keywords (more comprehensive)
    /\b(Software Engineer|Senior Software Engineer|Full Stack Developer|Frontend Developer|Backend Developer|Web Developer|Mobile Developer|iOS Developer|Android Developer|Data Scientist|Machine Learning Engineer|DevOps Engineer|System Administrator|Network Engineer|Security Engineer|QA Engineer|Quality Assurance Engineer|Product Manager|Project Manager|Business Analyst|UX Designer|UI Designer|Graphic Designer|Marketing Manager|Sales Manager|HR Manager|Operations Manager|Finance Manager|Account Manager|Customer Success Manager|Technical Lead|Team Lead|Architect|Consultant|Analyst|Specialist|Coordinator|Associate|Assistant|Intern|React Developer|Node.js Developer|JavaScript Developer|Python Developer|Java Developer|\.NET Developer|Frontend Engineer|Backend Engineer|Full Stack Engineer)\b/i,
    // Pattern: Role with company indicator
    /([^\n\r]{5,50})\s*(?:at|with|for)\s+[A-Z][a-zA-Z\s]+/i
  ];

  for (const pattern of rolePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let role = match[1].trim();
      // Clean up common prefixes/suffixes
      role = role.replace(/^(?:I am a|As a|Working as|Position:|Title:|Role:|Current Role:|Job Title:)\s+/i, '')
                 .replace(/\s*(?:with|at|for|in)\s+[a-zA-Z\s&]+.*$/, '')
                 .replace(/\s*\|.*$/, '') // Remove pipe separators
                 .replace(/\s*•.*$/, '') // Remove bullet points
                 .replace(/\s*-.*$/, '') // Remove dash separators
                 .trim();
      
      // Validate role length and content
      if (role.length > 3 && role.length < 60 && 
          /[a-zA-Z]/.test(role) &&
          !/^(?:resume|cv|contact|email|phone|address|summary|objective|experience|education|skills|projects|certifications|awards|interests|references)$/i.test(role)) {
        return role;
      }
    }
  }
  return '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileType, fileName, isBase64 } = await req.json();
    // @ts-ignore - Deno environment variable access
    const AI_API_KEY = Deno.env.get('AI_API_KEY');
    
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY not configured');
    }

    console.log('Parsing resume, file type:', fileType, 'file name:', fileName, 'isBase64:', isBase64);

    let textContent = fileContent || '';
    
    // Handle base64 encoded content
    if (isBase64 && fileContent) {
      try {
        // Attempt to decode base64 content to extract text
        const slice = fileContent.slice(0, 200000); // cap for perf
        // Remove whitespace and attempt to decode
        const cleanBase64 = slice.replace(/\s/g, '');
        let printable = '';
        
        try {
          // Try to decode base64 and extract printable characters
          const decoded = atob(cleanBase64);
          printable = decoded.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');
        } catch (decodeError) {
          console.error('Base64 decode failed:', decodeError);
          printable = '';
        }

        // If we got a decent amount of printable text, prefer it
        if (printable && printable.trim().length > 100) {
          textContent = printable;
        } else {
          // Fallback to previous prompt-guided approach for AI to infer
          if (fileType === 'application/pdf') {
            textContent = `This is a PDF resume file. The content below is base64 encoded. Try to infer readable text.

Base64 sample (first 10000 chars):\n${fileContent.substring(0, 10000)}`;
          } else if (fileType.includes('word') || fileName?.endsWith('.docx')) {
            textContent = `This is a DOCX resume file. The content below is base64 encoded. Try to infer readable text.

Base64 sample (first 10000 chars):\n${fileContent.substring(0, 10000)}`;
          }
        }
      } catch (error) {
        console.error('Error decoding base64:', error);
        textContent = fileContent;
      }
    }

    // First, attempt regex-based extraction directly from the decoded text
    const regexFirstPass = {
      name: extractNameWithRegex(textContent),
      email: extractEmailWithRegex(textContent),
      phone: extractPhoneWithRegex(textContent),
      role: extractRoleWithRegex(textContent)
    };

    // Use AI to extract information from resume (as a secondary pass)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume parser with extensive experience in extracting candidate information from various resume formats. Your task is to accurately extract specific information from resume content.

CRITICAL INSTRUCTIONS:
1. DO NOT generate fake or placeholder information like "John Doe", "Jaden Smith", "example@email.com", etc.
2. ONLY extract information that is actually present in the resume content.
3. If you cannot find a specific piece of information, return an empty string for that field.
4. For PDF/DOCX files, the content may be base64 encoded - look for readable text patterns within the encoding.

EXTRACTION GUIDELINES:
- NAME: Look for patterns at the top of the document, often in larger font or bold. Usually 2-3 words (First Last, or First Middle Last).
- EMAIL: Must contain @ symbol and domain. Look for patterns like name@company.com
- PHONE: Look for patterns with digits, hyphens, parentheses, spaces. Examples: (123) 456-7890, 123-456-7890, +1 123 456 7890
- ROLE: Look for job titles, positions, or "Professional Summary" sections. May include terms like "Software Engineer", "Developer", "Manager", etc.

Return the information in JSON format with these fields: name, email, phone, role.
If any field is not found in the actual resume content, return an empty string for that field.`
          },
          {
            role: 'user',
            content: `Parse this resume and extract: name, email, phone, and the role/position they are applying for or currently have.
            
File metadata:
- Type: ${fileType}
- Name: ${fileName}
- Format: ${isBase64 ? 'base64 encoded' : 'plain text'}

Resume content to analyze:
${textContent}

Remember: Extract ONLY what is actually present in the content. Do not generate or invent information.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_resume_info",
              description: "Extract candidate information from resume",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  role: { type: "string" }
                },
                required: ["name"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_resume_info" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    // If AI fails to return a structured response, we fall back entirely to regex
    const extractedInfo = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};
    console.log('Extracted info (AI):', extractedInfo);
    console.log('Regex first pass:', regexFirstPass);

    // Merge strategy: prefer regex (derived from actual text) over AI. AI fills gaps only.
    const merged = {
      name: regexFirstPass.name || extractedInfo.name || '',
      email: regexFirstPass.email || extractedInfo.email || '',
      phone: regexFirstPass.phone || extractedInfo.phone || '',
      role: regexFirstPass.role || extractedInfo.role || ''
    } as { name: string; email: string; phone: string; role: string };
    
    console.log('Merged info before validation:', merged);

    // Strict validation to ensure values truly come from resume text
    const textLower = (textContent || '').toLowerCase();
    const validateName = (name: string) => {
      if (!name) return '';
      
      // Expanded list of fake names to block
      const fakeNamePatterns = [
        /^(john|jane)\s+(doe|smith)$/i,
        /^(jaden|alex|sam|taylor|jordan|casey|morgan|riley|avery|quinn)\s+(doe|smith|johnson|williams|brown|jones|garcia|miller|davis)$/i,
        /^(candidate|applicant|user|test|example|sample)\s+(name|user|person)$/i,
        /^(mr|mrs|ms|dr)\s+(doe|smith|test|example)$/i
      ];
      
      // Check if it matches any fake pattern
      for (const pattern of fakeNamePatterns) {
        if (pattern.test(name)) return '';
      }
      
      // ensure at least one token appears in text
      const tokens = name.split(/\s+/).filter(Boolean);
      const present = tokens.some(t => textLower.includes(t.toLowerCase()));
      return present ? name : '';
    };
    const validateEmail = (email: string) => {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
      
      // Block fake/example email patterns
      const fakeEmailPatterns = [
        /^(example|test|sample|user|admin|contact|info|hello|world|candidate|applicant)@/i,
        /^.*@(example|test|sample|fake|dummy|temp|placeholder)\./i,
        /^.*@(gmail|yahoo|outlook|hotmail)\.com$/i // Block common providers unless they appear in text
      ];
      
      // Check if it matches any fake pattern
      for (const pattern of fakeEmailPatterns) {
        if (pattern.test(email)) return '';
      }
      
      // For common email providers, ensure the email appears in the text
      if (/@(gmail|yahoo|outlook|hotmail)\.com$/i.test(email)) {
        return textLower.includes(email.toLowerCase()) ? email : '';
      }
      
      return email;
    };
    const validatePhone = (phone: string) => {
      if (!phone) return '';
      const match = extractPhoneWithRegex(textContent);
      return match ? match : '';
    };
    const validateRole = (role: string) => {
      if (!role) return '';
      
      // Block fake/example role patterns
      const fakeRolePatterns = [
        /^(example|test|sample|fake|dummy|temp|placeholder)\s+(role|position|title|job)$/i,
        /^(candidate|applicant|user|employee|worker|staff|person)$/i,
        /^(position|title|role|job|occupation|profession)$/i,
        /^(unknown|not specified|to be determined|tbd)$/i
      ];
      
      // Check if it matches any fake pattern
      for (const pattern of fakeRolePatterns) {
        if (pattern.test(role)) return '';
      }
      
      // Ensure role keywords appear in text
      const tokens = role.split(/\s+/).filter(Boolean);
      const hasValidToken = tokens.some(token => {
        const lowerToken = token.toLowerCase();
        return textLower.includes(lowerToken) && 
               lowerToken.length > 2 && 
               !/^(the|and|or|of|in|at|to|for|with|by|from|on|as|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|can|this|that|these|those|a|an|the)$/i.test(lowerToken);
      });
      
      return hasValidToken ? role : '';
    };

    const finalInfo = {
      name: validateName(merged.name),
      email: validateEmail(merged.email),
      phone: validatePhone(merged.phone),
      role: validateRole(merged.role)
    };
    
    console.log('Final info after validation:', finalInfo);

    const missingFields = (['name','email','role','phone'] as const).filter(k => !finalInfo[k]);
    const needsUserInput = missingFields.some(f => f === 'name' || f === 'email' || f === 'role');

    return new Response(
      JSON.stringify({ 
        name: finalInfo.name,
        email: finalInfo.email,
        phone: finalInfo.phone,
        role: finalInfo.role,
        needsUserInput,
        missingFields,
        fullText: fileContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing resume:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to parse resume' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});