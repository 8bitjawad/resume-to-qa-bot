// @ts-ignore - Deno specific import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, resumeText } = await req.json();
    // @ts-ignore - Deno environment variable access
    const AI_API_KEY = Deno.env.get('AI_API_KEY');
    
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY not configured');
    }

    console.log('Generating React-specific questions for role:', role);

    // Generate 6 interview questions using AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert React technical interviewer. Generate exactly 6 interview questions based ONLY on React development (no other topics). 
            STRICTLY FORBID generic questions like "What is your favorite programming language?", "Tell me about yourself", "Why do you want this job?", "What are your strengths/weaknesses?", or any non-technical questions.

            ONLY generate technical React questions that require specific knowledge and code examples. Questions MUST be about:
            - React Hooks: useState, useEffect, useMemo, useCallback, useContext, useReducer, useRef, custom hooks
            - Component Architecture: functional vs class components, Higher-Order Components, render props
            - State Management: Context API, Redux, Zustand, or other state management solutions
            - Performance Optimization: React.memo, useMemo, useCallback, code splitting, lazy loading, virtualization
            - React Router: routing concepts, nested routes, route parameters, navigation
            - React Testing: React Testing Library, Jest, component testing, hook testing
            - React Internals: Virtual DOM, reconciliation, fiber architecture, component lifecycle
            - React Forms: controlled vs uncontrolled components, form validation, form libraries
            - React Patterns: compound components, render props, provider pattern
            - React Ecosystem: Next.js, React Native, React Query, React Hook Form

            EXAMPLES OF GOOD REACT QUESTIONS:
            Easy: "Explain the difference between useState and useReducer and when you would use each one."
            Easy: "What is the purpose of the dependency array in useEffect, and what happens when you omit it?"
            Medium: "How would you optimize a React component that re-renders unnecessarily? Explain the tools and techniques you'd use."
            Medium: "Describe how you would implement a custom hook for managing form state with validation."
            Hard: "Explain the React reconciliation process and how keys affect it. What are the performance implications?"
            Hard: "How would you design a state management solution for a large React application using Context API to avoid prop drilling?"

            AVOID THESE GENERIC PATTERNS:
            - "What is your favorite...?"
            - "Tell me about..."
            - "Why do you want...?"
            - "What are your strengths/weaknesses?"
            - "Describe your experience with..."
            - Any non-React technical questions

            Output strictly JSON: 6 questions, exactly 2 easy, 2 medium, 2 hard. Do not include any explanation or extra keys.`
          },
          {
            role: 'user',
            content: `Role: ${role}\n\nResume context: ${resumeText || 'No resume provided'}\n\nGenerate 6 React-specific TECHNICAL interview questions only. No generic questions about preferences, personal background, or non-React topics. Questions must require specific React knowledge and should be answerable with code examples or technical explanations.\n\nGenerate in this exact JSON format:\n{\n  "questions": [\n    {"text": "question text", "difficulty": "easy"},\n    {"text": "question text", "difficulty": "easy"},\n    {"text": "question text", "difficulty": "medium"},\n    {"text": "question text", "difficulty": "medium"},\n    {"text": "question text", "difficulty": "hard"},\n    {"text": "question text", "difficulty": "hard"}\n  ]\n}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: "Generate React-specific interview questions with difficulty levels",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                      },
                      required: ["text", "difficulty"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    // Extract questions from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    let questions = result.questions;

    // Runtime validation: ensure exactly 6 questions and topics are React/Node-only
    const isAllowedTopic = (text: string) => {
      const t = (text || '').toLowerCase();
      const allow = [
        'react', 'hook', 'jsx', 'component', 'state', 'context', 'redux', 'router', 'vite', 'next.js',
        'node', 'express', 'event loop', 'async', 'promise', 'middleware', 'jwt', 'authentication', 'authorization', 'postgres', 'mongodb', 'orm', 'prisma', 'nest.js', 'error', 'logging', 'stream', 'cluster'
      ];
      const deny = ['python','java','c#','c++','go ','golang','rust','devops','kubernetes','docker','ml','machine learning','data science','android','ios','swift','kotlin','php','laravel','ruby','rails','hadoop','spark','scala','angular','vue','svelte','system design'];
      if (deny.some(d => t.includes(d))) return false;
      return allow.some(a => t.includes(a));
    };

    const difficulties = ['easy','easy','medium','medium','hard','hard'];

    const fallbackQuestions = [
      { text: 'Explain how useEffect differs from useLayoutEffect. When prefer each?', difficulty: 'easy' },
      { text: 'What problems do React keys solve? Show a case that breaks without keys.', difficulty: 'easy' },
      { text: 'Walk through Node.js event loop phases and microtasks vs macrotasks.', difficulty: 'medium' },
      { text: 'Design Express middleware for request validation and error handling.', difficulty: 'medium' },
      { text: 'Optimize a React list of 10k items: techniques and trade-offs.', difficulty: 'hard' },
      { text: 'Scale a Node.js API under heavy load: clustering, workers, and bottlenecks.', difficulty: 'hard' }
    ];

    if (!Array.isArray(questions)) questions = [];
    // Coerce, filter by topic, and enforce difficulties
    questions = questions
      .map((q: any, i: number) => ({
        text: typeof q?.text === 'string' ? q.text : '',
        difficulty: ['easy','medium','hard'].includes((q?.difficulty||'').toLowerCase()) ? (q.difficulty as string).toLowerCase() : difficulties[i] || 'easy'
      }))
      .filter(q => q.text && isAllowedTopic(q.text));

    // Ensure exactly 6 items, fill or trim to match difficulty plan
    const byDiff: Record<string, any[]> = { easy: [], medium: [], hard: [] };
    for (const q of questions) {
      if (byDiff[q.difficulty].length < difficulties.filter(d => d===q.difficulty).length) byDiff[q.difficulty].push(q);
    }
    const resultList: any[] = [];
    for (const diff of difficulties) {
      let picked = byDiff[diff].shift();
      if (!picked) {
        // take from fallback with matching difficulty
        picked = fallbackQuestions.find(f => f.difficulty === diff && !resultList.some(r => r.text === f.text));
      }
      if (!picked) {
        // ultimate fallback
        picked = { text: `Provide a ${diff} React/Node.js question about core concepts.`, difficulty: diff };
      }
      resultList.push(picked);
    }
    questions = resultList;

    console.log('Generated questions:', questions);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating questions:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate questions',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});