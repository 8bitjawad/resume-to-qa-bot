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
      const text = await uploadedFile.text();
      
      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: { fileContent: text, fileType: uploadedFile.type }
      });

      if (error) throw error;

      setCandidateInfo({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || ''
      });

      toast.success('Resume parsed successfully!');
      setStep('info');
    } catch (error) {
      console.error('Error parsing resume:', error);
      toast.error('Failed to parse resume. Please enter details manually.');
      setStep('info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!candidateInfo.name || !candidateInfo.email || !candidateInfo.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Create candidate
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          name: candidateInfo.name,
          email: candidateInfo.email,
          phone: candidateInfo.phone,
          role_applied: candidateInfo.role
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
        body: { role: candidateInfo.role, resumeText: file ? await file.text() : '' }
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
                <h3 className="text-2xl font-semibold mb-4">Confirm Your Information</h3>
                <Input
                  placeholder="Full Name *"
                  value={candidateInfo.name}
                  onChange={(e) => setCandidateInfo({ ...candidateInfo, name: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Email *"
                  value={candidateInfo.email}
                  onChange={(e) => setCandidateInfo({ ...candidateInfo, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={candidateInfo.phone}
                  onChange={(e) => setCandidateInfo({ ...candidateInfo, phone: e.target.value })}
                />
                <Input
                  placeholder="Role/Position *"
                  value={candidateInfo.role}
                  onChange={(e) => setCandidateInfo({ ...candidateInfo, role: e.target.value })}
                />
                <Button
                  onClick={handleStartInterview}
                  disabled={isLoading}
                  className="w-full bg-[var(--gradient-primary)] hover:opacity-90"
                >
                  {isLoading ? 'Starting...' : 'Start Interview'}
                </Button>
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
                  className="w-full bg-[var(--gradient-primary)] hover:opacity-90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Answer
                </Button>
              </div>
            )}

            {step === 'complete' && (
              <div className="text-center space-y-6 py-8">
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