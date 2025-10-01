import { useState, useEffect } from "react";
import { Users, TrendingUp, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Candidate {
  id: string;
  name: string;
  email: string;
  role_applied: string;
  final_score: number;
  summary: string;
  status: string;
  created_at: string;
}

interface Answer {
  id: string;
  answer_text: string;
  time_taken: number;
  question: {
    question_text: string;
    difficulty: string;
  };
}

export default function InterviewerDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('candidates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates'
        },
        () => {
          fetchCandidates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast.error('Failed to load candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const viewCandidateDetails = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);

    try {
      const { data: interviewData } = await supabase
        .from('interviews')
        .select('id')
        .eq('candidate_id', candidate.id)
        .single();

      if (!interviewData) return;

      const { data: answersData, error } = await supabase
        .from('answers')
        .select(`
          id,
          answer_text,
          time_taken,
          questions (
            question_text,
            difficulty
          )
        `)
        .eq('interview_id', interviewData.id)
        .order('submitted_at', { ascending: true });

      if (error) throw error;

      const formattedAnswers = answersData?.map(a => ({
        id: a.id,
        answer_text: a.answer_text,
        time_taken: a.time_taken,
        question: {
          question_text: (a as any).questions.question_text,
          difficulty: (a as any).questions.difficulty
        }
      })) || [];

      setAnswers(formattedAnswers);
    } catch (error) {
      console.error('Error fetching answers:', error);
      toast.error('Failed to load candidate details');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const completedCount = candidates.filter(c => c.status === 'completed').length;
  const avgScore = completedCount > 0
    ? Math.round(candidates.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.final_score, 0) / completedCount)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Interviewer Dashboard
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Candidates</p>
                  <p className="text-3xl font-bold">{candidates.length}</p>
                </div>
                <Users className="w-12 h-12 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold">{completedCount}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-600/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidates Table */}
        <Card className="shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle>All Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading candidates...</p>
            ) : candidates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No candidates yet</p>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    className="hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => viewCandidateDetails(candidate)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{candidate.name}</h3>
                            <Badge variant={candidate.status === 'completed' ? 'default' : 'secondary'}>
                              {candidate.status === 'completed' ? 'Completed' : 'In Progress'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{candidate.email}</p>
                          <p className="text-sm font-medium">{candidate.role_applied}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {candidate.status === 'completed' && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Score</p>
                              <p className={`text-2xl font-bold ${getScoreColor(candidate.final_score)}`}>
                                {candidate.final_score}
                              </p>
                            </div>
                          )}
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidate Details Dialog */}
        <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedCandidate?.name}</DialogTitle>
            </DialogHeader>

            {selectedCandidate && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCandidate.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{selectedCandidate.role_applied}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{selectedCandidate.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(selectedCandidate.final_score)}`}>
                      {selectedCandidate.final_score}
                    </p>
                  </div>
                </div>

                {selectedCandidate.summary && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Summary</p>
                    <Card className="bg-accent/50">
                      <CardContent className="pt-4">
                        <p>{selectedCandidate.summary}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-lg mb-3">Interview Answers</h4>
                  <div className="space-y-4">
                    {answers.map((answer, index) => (
                      <Card key={answer.id}>
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">Question {index + 1}</Badge>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{answer.time_taken}s</span>
                            </div>
                          </div>
                          <p className="font-medium">{answer.question.question_text}</p>
                          <div className="bg-accent/30 rounded p-3">
                            <p className="text-sm">{answer.answer_text}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}