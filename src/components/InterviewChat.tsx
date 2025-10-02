import { useState, useEffect, useRef } from "react";
import { Upload, Send, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

// Validation helper functions
const validateAndCleanName = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  
  const cleaned = name.trim();
  
  // List of fake/example names to filter out
  const fakeNames = [
    'john doe', 'jane doe', 'john smith', 'jane smith',
    'jaden smith', 'john', 'jane', 'smith', 'doe',
    'example name', 'test name', 'sample name',
    'candidate name', 'applicant name', 'user name'
  ];
  
  // Check if it's a fake name
  if (fakeNames.includes(cleaned.toLowerCase())) {
    return '';
  }
  
  // Basic name validation (2-50 characters, letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]{2,50}$/.test(cleaned)) {
    return '';
  }
  
  // Should have at least one space (first and last name)
  if (!cleaned.includes(' ')) {
    return '';
  }
  
  return cleaned;
};

const validateAndCleanEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  
  const cleaned = email.trim().toLowerCase();
  
  // List of fake/example emails to filter out
  const fakeEmails = [
    'example@email.com', 'test@email.com', 'sample@email.com',
    'user@email.com', 'admin@email.com', 'contact@email.com',
    'info@email.com', 'hello@email.com', 'world@email.com',
    'john.doe@email.com', 'jane.smith@email.com',
    'example.com', 'test.com', 'sample.com'
  ];
  
  // Check if it's a fake email
  if (fakeEmails.includes(cleaned)) {
    return '';
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    return '';
  }
  
  return cleaned;
};

const validateAndCleanPhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';
  
  const cleaned = phone.trim();
  
  // Remove all non-digit characters for validation
  const digitsOnly = cleaned.replace(/\D/g, '');
  
  // Should have 10-15 digits (including country code)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return '';
  }
  
  // Basic phone validation (contains digits and common phone characters)
  if (!/[\d\s\-\(\)\+\.]/.test(cleaned)) {
    return '';
  }
  
  return cleaned;
};

const validateAndCleanRole = (role: string): string => {
  if (!role || typeof role !== 'string') return '';
  
  const cleaned = role.trim();
  
  // List of fake/example roles to filter out
  const fakeRoles = [
    'example role', 'test role', 'sample role',
    'position', 'job title', 'role', 'title',
    'candidate', 'applicant', 'user', 'employee'
  ];
  
  // Check if it's a fake role
  if (fakeRoles.includes(cleaned.toLowerCase())) {
    return '';
  }
  
  // Should be at least 3 characters and contain letters
  if (cleaned.length < 3 || !/[a-zA-Z]/.test(cleaned)) {
    return '';
  }
  
  return cleaned;
};

export default function InterviewChat() {
  const [step, setStep] = useState<'upload' | 'info' | 'interview' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [candidateId, setCandidateId] = useState<string>('');
  const [interviewId, setInterviewId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const difficultyConfig = {
    easy: { timeLimit: 20, color: 'text-green-600', label: 'Easy' },
    medium: { timeLimit: 60, color: 'text-yellow-600', label: 'Medium' },
    hard: { timeLimit: 120, color: 'text-red-600', label: 'Hard' }
  };

  useEffect(() => {
    if (step === 'interview' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (step === 'interview' && timeLeft === 0 && questions.length > 0) {
      handleSubmitAnswer();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, step]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.match(/\.(pdf|docx|doc|txt)$/i)) {
      toast.error('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    setFile(uploadedFile);
    setIsLoading(true);

    try {
      let text = '';
      
      // Handle different file types
      if (uploadedFile.type === 'text/plain') {
        text = await uploadedFile.text();
      } else if (uploadedFile.type === 'application/pdf') {
        // For PDF files, we'll use the Supabase function to parse
        // Convert to base64 for better handling
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        text = base64;
      } else if (uploadedFile.type.includes('word') || uploadedFile.name.endsWith('.docx')) {
        // For DOCX files, convert to base64
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        text = base64;
      } else {
        // Fallback to text
        text = await uploadedFile.text();
      }
      
      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: { 
          fileContent: text, 
          fileType: uploadedFile.type,
          fileName: uploadedFile.name,
          isBase64: uploadedFile.type !== 'text/plain'
        }
      });

      if (error) throw error;
      
      console.log('Raw data from backend:', data);

      // Validate and clean parsed information
      const parsedInfo = {
        name: validateAndCleanName(data.name || ''),
        email: validateAndCleanEmail(data.email || ''),
        phone: validateAndCleanPhone(data.phone || ''),
        role: validateAndCleanRole(data.role || '')
      };
      
      console.log('Parsed info after frontend validation:', parsedInfo);

      setCandidateInfo(parsedInfo);

      // Check if we need user input based on the response
      if (data.needsUserInput) {
        const missing = data.missingFields || [];
        const missingText = missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'Some information could not be extracted';
        toast.warning(`Resume partially parsed. ${missingText}. Please complete the information.`);
        setStep('info');
      } else if (parsedInfo.name && parsedInfo.email && parsedInfo.role) {
        toast.success('Resume parsed successfully! Starting interview...');
        // Auto-start interview with parsed info
        setTimeout(() => {
          startInterviewWithInfo(parsedInfo);
        }, 1000);
      } else {
        toast.warning('Resume parsing incomplete. Please review and complete the information.');
        setStep('info');
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      toast.error('Failed to parse resume. Please enter details manually.');
      setStep('info');
    } finally {
      setIsLoading(false);
    }
  };

  const startInterviewWithInfo = async (info: typeof candidateInfo) => {
    if (!info.name || !info.email || !info.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Create candidate
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          name: info.name,
          email: info.email,
          phone: info.phone,
          role_applied: info.role
        })
        .select()
        .single();

      if (candidateError) throw candidateError;
      setCandidateId(candidate.id);

      // Create interview
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .insert({ candidate_id: candidate.id })
        .select()
        .single();

      if (interviewError) throw interviewError;
      setInterviewId(interview.id);

      // Generate questions
      const { data: questionsData, error: questionsError } = await supabase.functions.invoke('generate-questions', {
        body: { role: info.role, resumeText: file ? await file.text() : '' }
      });

      if (questionsError) throw questionsError;

      // Save questions to database
      const questionsToInsert = questionsData.questions.map((q: any, index: number) => ({
        interview_id: interview.id,
        question_text: q.text,
        difficulty: q.difficulty,
        time_limit: difficultyConfig[q.difficulty as keyof typeof difficultyConfig].timeLimit,
        order_index: index
      }));

      const { data: savedQuestions, error: saveError } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select();

      if (saveError) throw saveError;

      const formattedQuestions = savedQuestions.map(q => ({
        id: q.id,
        text: q.question_text,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        timeLimit: q.time_limit
      }));

      setQuestions(formattedQuestions);
      setTimeLeft(formattedQuestions[0].timeLimit);
      setStep('interview');
      toast.success('Interview started!');
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = async () => {
    startInterviewWithInfo(candidateInfo);
  };

  const handleSubmitAnswer = async () => {
    if (currentQuestionIndex >= questions.length) return;

    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = currentQuestion.timeLimit - timeLeft;

    try {
      await supabase.from('answers').insert({
        interview_id: interviewId,
        question_id: currentQuestion.id,
        answer_text: answer || '(No answer provided)',
        time_taken: timeTaken
      });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setAnswer('');
        setTimeLeft(questions[currentQuestionIndex + 1].timeLimit);
      } else {
        await completeInterview();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    }
  };

  const completeInterview = async () => {
    try {
      // Calculate mock score (60-95 range)
      const score = Math.floor(Math.random() * 35) + 60;
      const summary = `Candidate completed ${questions.length} questions. Demonstrated good communication skills and technical knowledge. Score: ${score}/100`;

      await supabase
        .from('candidates')
        .update({ final_score: score, summary, status: 'completed' })
        .eq('id', candidateId);

      await supabase
        .from('interviews')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', interviewId);

      setStep('complete');
      toast.success('Interview completed!');
    } catch (error) {
      console.error('Error completing interview:', error);
      toast.error('Failed to complete interview');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AI Interview Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'upload' && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
                  <p className="text-muted-foreground mb-4">PDF, DOCX, or TXT format</p>
                  <Input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileUpload}
                    className="max-w-xs mx-auto"
                  />
                </div>
                {isLoading && <p className="text-center text-muted-foreground">Parsing resume...</p>}
              </div>
            )}

            {step === 'info' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold mb-4">
                  {candidateInfo.name && candidateInfo.email && candidateInfo.role 
                    ? 'Review Extracted Information' 
                    : 'Complete Your Information'}
                </h3>
                
                {candidateInfo.name && candidateInfo.email && candidateInfo.role && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 text-sm">
                      ✅ Information extracted from your resume. Please review and edit if needed.
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Full Name *</label>
                    <Input
                      placeholder="Full Name *"
                      value={candidateInfo.name}
                      onChange={(e) => setCandidateInfo({ ...candidateInfo, name: e.target.value })}
                      className={candidateInfo.name ? 'border-green-200' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Email *</label>
                    <Input
                      type="email"
                      placeholder="Email *"
                      value={candidateInfo.email}
                      onChange={(e) => setCandidateInfo({ ...candidateInfo, email: e.target.value })}
                      className={candidateInfo.email ? 'border-green-200' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Phone</label>
                    <Input
                      placeholder="Phone"
                      value={candidateInfo.phone}
                      onChange={(e) => setCandidateInfo({ ...candidateInfo, phone: e.target.value })}
                      className={candidateInfo.phone ? 'border-green-200' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Role/Position *</label>
                    <Input
                      placeholder="Role/Position *"
                      value={candidateInfo.role}
                      onChange={(e) => setCandidateInfo({ ...candidateInfo, role: e.target.value })}
                      className={candidateInfo.role ? 'border-green-200' : ''}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleStartInterview}
                  disabled={isLoading || !candidateInfo.name || !candidateInfo.email || !candidateInfo.role}
                  className="w-full bg-purple-600 text-white hover:bg-purple-700"
                >
                  {isLoading ? 'Starting...' : 'Start Interview'}
                </Button>
                
                {file && (
                  <div className="text-center text-sm text-muted-foreground mt-4">
                    <p>📄 Uploaded: {file.name}</p>
                    <button 
                      onClick={() => {
                        setFile(null);
                        setCandidateInfo({ name: '', email: '', phone: '', role: '' });
                        setStep('upload');
                      }}
                      className="text-blue-600 hover:underline mt-1"
                    >
                      Upload different resume
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 'interview' && questions.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                    <span className={`text-sm font-semibold ${difficultyConfig[questions[currentQuestionIndex].difficulty].color}`}>
                      {difficultyConfig[questions[currentQuestionIndex].difficulty].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Clock className="w-5 h-5" />
                    <span className="text-2xl">{timeLeft}s</span>
                  </div>
                </div>

                <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />

                <Card className="bg-accent/50">
                  <CardContent className="pt-6">
                    <p className="text-lg font-medium">{questions[currentQuestionIndex].text}</p>
                  </CardContent>
                </Card>

                <Textarea
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="min-h-[200px]"
                />

                <Button
                  onClick={handleSubmitAnswer}
                  className="w-full bg-purple-600 text-white hover:bg-purple-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Answer
                </Button>
              </div>
            )}

            {step === 'complete' && (
              <div className="space-y-6 text-center">
                <CheckCircle2 className="w-20 h-20 mx-auto text-green-600" />
                <h3 className="text-3xl font-bold">Interview Completed!</h3>
                <p className="text-lg text-muted-foreground">
                  Thank you for participating. Your responses have been recorded and will be reviewed by our team.
                </p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Start New Interview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}