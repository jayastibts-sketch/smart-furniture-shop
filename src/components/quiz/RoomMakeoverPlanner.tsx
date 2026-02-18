import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, Home, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const questions = [
  {
    id: "room",
    question: "Which room are you planning to makeover?",
    options: [
      { label: "Living Room", value: "living", emoji: "🛋️" },
      { label: "Bedroom", value: "bedroom", emoji: "🛏️" },
      { label: "Dining Room", value: "dining", emoji: "🍽️" },
      { label: "Home Office", value: "office", emoji: "💼" },
    ],
  },
  {
    id: "size",
    question: "How big is your room?",
    options: [
      { label: "Compact (under 100 sq ft)", value: "small", emoji: "📐" },
      { label: "Medium (100–200 sq ft)", value: "medium", emoji: "📏" },
      { label: "Large (200–400 sq ft)", value: "large", emoji: "🏠" },
      { label: "Spacious (400+ sq ft)", value: "xl", emoji: "🏡" },
    ],
  },
  {
    id: "goal",
    question: "What's your main makeover goal?",
    options: [
      { label: "Start from scratch", value: "fresh", emoji: "🆕" },
      { label: "Upgrade key pieces", value: "upgrade", emoji: "⬆️" },
      { label: "Add accent furniture", value: "accent", emoji: "🎯" },
      { label: "Maximize storage", value: "storage", emoji: "📦" },
    ],
  },
  {
    id: "timeline",
    question: "When do you want to complete this?",
    options: [
      { label: "This week", value: "asap", emoji: "⚡" },
      { label: "This month", value: "month", emoji: "📅" },
      { label: "In 2-3 months", value: "quarter", emoji: "🗓️" },
      { label: "No rush", value: "flexible", emoji: "🧘" },
    ],
  },
];

interface PlanItem {
  category: string;
  suggestion: string;
  priority: "essential" | "recommended" | "optional";
}

const roomPlans: Record<string, PlanItem[]> = {
  living: [
    { category: "Sofa / Sectional", suggestion: "A solid wood-frame sofa as the centerpiece", priority: "essential" },
    { category: "Coffee Table", suggestion: "A carved or live-edge coffee table", priority: "essential" },
    { category: "TV Unit", suggestion: "Teak wood entertainment unit with storage", priority: "recommended" },
    { category: "Bookshelf", suggestion: "Open sheesham wood bookshelf for display", priority: "optional" },
  ],
  bedroom: [
    { category: "Bed Frame", suggestion: "Solid wood platform bed with headboard", priority: "essential" },
    { category: "Wardrobe", suggestion: "Spacious rosewood or teak wardrobe", priority: "essential" },
    { category: "Nightstand", suggestion: "Matching bedside table with drawer", priority: "recommended" },
    { category: "Dresser", suggestion: "Carved wood dresser with mirror", priority: "optional" },
  ],
  dining: [
    { category: "Dining Table", suggestion: "6-seater solid wood dining table", priority: "essential" },
    { category: "Dining Chairs", suggestion: "Set of matching wooden chairs", priority: "essential" },
    { category: "Buffet / Sideboard", suggestion: "Storage sideboard for crockery", priority: "recommended" },
    { category: "Bar Cabinet", suggestion: "Small bar unit or display cabinet", priority: "optional" },
  ],
  office: [
    { category: "Desk", suggestion: "L-shaped or writing desk in teak", priority: "essential" },
    { category: "Office Chair", suggestion: "Ergonomic wooden swivel chair", priority: "essential" },
    { category: "Bookcase", suggestion: "Tall bookcase with closed storage", priority: "recommended" },
    { category: "Filing Unit", suggestion: "Compact drawer chest for documents", priority: "optional" },
  ],
};

const priorityColors: Record<string, string> = {
  essential: "bg-primary/10 text-primary border-primary/20",
  recommended: "bg-accent text-accent-foreground border-accent",
  optional: "bg-muted text-muted-foreground border-muted",
};

export function RoomMakeoverPlanner() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (qId: string, value: string) => {
    const next = { ...answers, [qId]: value };
    setAnswers(next);
    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setShowResults(false);
  };

  const plan = roomPlans[answers.room] || roomPlans.living;
  const progress = showResults ? 100 : ((step + (answers[questions[step]?.id] ? 1 : 0)) / questions.length) * 100;

  const roomLabel = questions[0].options.find(o => o.value === answers.room)?.label || "Your Room";

  return (
    <div>
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-3">
          <Home className="h-3 w-3 mr-1" /> Room Planner
        </Badge>
        <h2 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
          Room Makeover Planner
        </h2>
        <p className="text-muted-foreground mt-2">Get a personalized furniture checklist for your room</p>
      </div>

      <div className="max-w-2xl mx-auto mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {showResults ? "Your plan is ready!" : `Question ${step + 1} of ${questions.length}`}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <h3 className="text-xl font-semibold text-center mb-6">{questions[step].question}</h3>
              <div className="grid grid-cols-2 gap-4">
                {questions[step].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(questions[step].id, opt.value)}
                    className={`p-5 rounded-xl border-2 text-left transition-all hover:border-primary hover:shadow-md ${
                      answers[questions[step].id] === opt.value ? "border-primary bg-primary/5 shadow-md" : "border-border bg-background"
                    }`}
                  >
                    <span className="text-2xl block mb-2">{opt.emoji}</span>
                    <span className="font-medium text-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
              {step > 0 && (
                <Button variant="ghost" className="mt-4" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <h3 className="text-xl font-semibold text-center mb-2">
                🏡 Your {roomLabel} Makeover Plan
              </h3>
              <p className="text-center text-muted-foreground mb-6">Here's what we recommend for your space</p>
              <div className="space-y-3">
                {plan.map((item, i) => (
                  <Card key={i} className={`p-4 border ${priorityColors[item.priority]}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{item.category}</h4>
                        <p className="text-sm text-muted-foreground">{item.suggestion}</p>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs shrink-0 ml-3">
                        {item.priority}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex justify-center gap-3 mt-8">
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Start Over
                </Button>
                <Link to="/products">
                  <Button>
                    Shop Now <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
