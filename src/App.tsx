/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  LayoutDashboard,
  Timer,
  FileText,
  TrendingUp,
  DollarSign,
  Info,
  AlertCircle,
  Send,
  Loader2,
  ArrowLeft,
  Sparkles
} from "lucide-react";

const Section = ({ title, children, icon: Icon, id }: { title: string, children: ReactNode, icon?: any, id?: string }) => (
  <motion.section 
    id={id}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="mb-16"
  >
    <div className="flex items-center gap-3 mb-6">
      {Icon && <Icon className="w-8 h-8 text-blue-600" />}
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
    </div>
    <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
      {children}
    </div>
  </motion.section>
);

const FeatureCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <Icon className="w-10 h-10 text-blue-500 mb-4" />
    <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600">{description}</p>
  </div>
);

export default function App() {
  const [view, setView] = useState<"guide" | "ai">("guide");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai", content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: "You are a professional expert on 7pace Timetracker for Azure DevOps. Answer questions about time tracking, productivity, and project management using 7pace. Be concise, professional, and helpful.",
        }
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: "ai", content: aiResponse }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages(prev => [...prev, { role: "ai", content: "An error occurred while connecting to the AI. Please check your configuration." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (view === "ai") {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        {/* AI Header */}
        <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button 
              onClick={() => setView("guide")}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Guide
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-900">7pace AI Assistant</span>
            </div>
            <div className="w-20"></div> {/* Spacer */}
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 overflow-y-auto">
          <div className="space-y-6">
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">How can I help you with 7pace?</h2>
                <p className="text-slate-600">Ask me about features, setup, or best practices.</p>
              </motion.div>
            )}
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-slate-500 text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Input Area */}
        <footer className="bg-white border-t border-slate-200 p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask a question about 7pace Timetracker..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-3 rounded-xl transition-all shadow-md"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-bold">
            Powered by Gemini AI • Created by Sanjith Anumola
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header / Hero */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900">7pace <span className="text-blue-600">Guide</span></span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-blue-600 transition-colors">Workflow</a>
            <a href="#benefits" className="hover:text-blue-600 transition-colors">Benefits</a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Introduction */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-blue-700 uppercase bg-blue-50 rounded-full">
            Product Expert Guide
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            7pace Timetracker for Azure DevOps
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            A comprehensive look at the industry-leading time management solution by <span className="font-semibold text-slate-900">Appfire</span>, 
            designed specifically for software development teams.
          </p>
        </motion.div>

        <Section title="1. Introduction" icon={Info}>
          <p className="mb-4">
            <strong>7pace Timetracker</strong> is a professional time management solution built natively for Azure DevOps. 
            Unlike generic time tracking tools, it is deeply integrated into the developer workflow, allowing teams to log time 
            directly on work items without ever leaving their environment.
          </p>
          <p className="mb-4">
            Originally an independent success, 7pace was acquired by <strong>Appfire</strong>, a leading provider of enterprise-grade 
            apps for software development platforms. Its primary purpose is to bridge the gap between development effort and 
            business intelligence, providing accurate data for planning, billing, and productivity analysis.
          </p>
        </Section>

        <Section title="2. Key Features" icon={LayoutDashboard} id="features">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <FeatureCard 
              icon={Timer}
              title="Integrated Timers"
              description="Start and stop timers directly within Azure DevOps work items for precise, real-time tracking."
            />
            <FeatureCard 
              icon={FileText}
              title="Timesheets"
              description="Comprehensive weekly and monthly views for manual entry and bulk time management."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Reporting & Analytics"
              description="Powerful built-in reports to visualize team capacity, velocity, and effort distribution."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Approval Workflows"
              description="Formal submission and approval process to ensure data integrity for billing and payroll."
            />
            <FeatureCard 
              icon={DollarSign}
              title="Budget & Billing"
              description="Track project costs against budgets and export data for client invoicing."
            />
            <FeatureCard 
              icon={Zap}
              title="API & Integration"
              description="Robust REST API and OData support for connecting with Power BI, Excel, or custom tools."
            />
          </div>
        </Section>

        <Section title="3. How It Works" icon={TrendingUp} id="workflow">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="space-y-8">
              {[
                { step: "01", title: "Start Tracking", text: "Open any Azure DevOps work item and click 'Start Tracking' or manually enter the duration." },
                { step: "02", title: "Log Effort", text: "Add comments and select activity types (e.g., Development, Testing, Meeting) to categorize your work." },
                { step: "03", title: "Submit Timesheet", text: "At the end of the week, review your logged hours and submit them for approval." },
                { step: "04", title: "Review & Approve", text: "Managers review the submitted time, ensuring accuracy before locking the period for reporting." }
              ].map((item, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-slate-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="4. Benefits" icon={CheckCircle2} id="benefits">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="mt-1"><CheckCircle2 className="text-green-500 w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Productivity Improvement</h4>
                <p className="text-slate-600">By understanding where time goes, teams can identify bottlenecks and optimize their sprints.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><CheckCircle2 className="text-green-500 w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Accurate Tracking</h4>
                <p className="text-slate-600">Eliminates the guesswork of "end-of-week" estimations by capturing time as it happens.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><CheckCircle2 className="text-green-500 w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Better Project Management</h4>
                <p className="text-slate-600">Provides real-time visibility into project health and budget consumption.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><CheckCircle2 className="text-green-500 w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Team Accountability</h4>
                <p className="text-slate-600">Encourages a culture of transparency and data-driven decision making.</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="5. Use Cases" icon={Users}>
          <div className="space-y-6">
            <div className="p-6 bg-slate-100 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-2">Software Development Teams</h4>
              <p className="text-slate-600">Ideal for internal teams tracking R&D tax credits or measuring sprint velocity accurately.</p>
            </div>
            <div className="p-6 bg-slate-100 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-2">Agile & Scrum Teams</h4>
              <p className="text-slate-600">Helps in refining story point estimations by comparing estimated vs. actual effort.</p>
            </div>
            <div className="p-6 bg-slate-100 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-2">Freelancers & Agencies</h4>
              <p className="text-slate-600">Essential for billing clients based on precise work logs attached to specific deliverables.</p>
            </div>
          </div>
        </Section>

        <Section title="6. Pros and Cons" icon={AlertCircle}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Pros
              </h4>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>• Seamless Azure DevOps integration</li>
                <li>• Native feel (no context switching)</li>
                <li>• Powerful API for custom reporting</li>
                <li>• Enterprise-grade security</li>
              </ul>
            </div>
            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
              <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Cons
              </h4>
              <ul className="space-y-2 text-red-800 text-sm">
                <li>• Slight learning curve for advanced features</li>
                <li>• Requires Azure DevOps environment</li>
                <li>• Cost can be high for very large teams</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section title="7. Pricing Overview" icon={DollarSign}>
          <p className="mb-6">
            7pace Timetracker typically follows a subscription-based pricing model, often tiered based on the number of users. 
            While specific pricing can vary based on your Azure DevOps deployment (Cloud vs. Server), it generally offers:
          </p>
          <ul className="list-disc pl-6 space-y-3 mb-6">
            <li><strong>Free Trial:</strong> Usually a 30-day full-featured trial to test integration.</li>
            <li><strong>Tiered Pricing:</strong> Cost per user decreases as the team size grows.</li>
            <li><strong>Enterprise Plans:</strong> Custom quotes for very large organizations with specific support needs.</li>
          </ul>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm italic">
            Note: Always check the official Appfire or Azure Marketplace page for the most current pricing details.
          </div>
        </Section>

        <Section title="8. Conclusion" icon={ChevronRight}>
          <p className="text-lg font-medium text-slate-800 mb-4">
            Why should your team use it?
          </p>
          <p className="mb-6">
            In the modern software landscape, data is king. 7pace Timetracker transforms time from a "chore" into a 
            strategic asset. By integrating effort tracking directly into the development lifecycle, it provides 
            unmatched accuracy and insights that help teams ship better software, more predictably.
          </p>
          <div className="flex justify-center mt-12">
            <button 
              onClick={() => setView("ai")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
            >
              Get Started with 7pace
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </Section>

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-slate-200 text-center text-slate-500 text-sm">
          <p className="mb-2">Professional Technical Guide by Sanjith Anumola</p>
          <p>© 2026 Product Insights. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
