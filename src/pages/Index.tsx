import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, BarChart3 } from "lucide-react";
import InterviewChat from "@/components/InterviewChat";
import InterviewerDashboard from "@/components/InterviewerDashboard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("interviewee");

  return (
    <div className="min-h-screen">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 h-14 p-1">
            <TabsTrigger value="interviewee" className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              Interviewee
            </TabsTrigger>
            <TabsTrigger value="interviewer" className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Interviewer
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="interviewee" className="m-0">
          <InterviewChat />
        </TabsContent>

        <TabsContent value="interviewer" className="m-0">
          <InterviewerDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
