import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Palette } from "lucide-react";

interface QuizOption {
  label: string;
  value: string;
  emoji: string;
}

const questions = [
  {
    id: "vibe",
    question: "Pick a weekend vibe that speaks to you",
    options: [
      { label: "Cozy reading nook", value: "traditional", emoji: "📚" },
      { label: "Gallery hopping", value: "modern", emoji: "🎨" },
      { label: "Forest cabin retreat", value: "rustic", emoji: "🏕️" },
      { label: "Boutique hotel stay", value: "luxury", emoji: "🥂" },
    ],
  },
  {
    id: "color",
    question: "Which color palette draws you in?",
    options: [
      { label: "Warm earth tones", value: "warm", emoji: "🟤" },
      { label: "Cool neutrals & whites", value: "cool", emoji: "⚪" },
      { label: "Bold & dramatic darks", value: "bold", emoji: "⬛" },
      { label: "Soft pastels & naturals", value: "soft", emoji: "🌸" },
    ],
  },
  {
    id: "texture",
    question: "What texture feels like home?",
    options: [
      { label: "Polished & sleek", value: "polished", emoji: "✨" },
      { label: "Raw & unfinished wood", value: "raw", emoji: "🪵" },
      { label: "Carved & ornate", value: "carved", emoji: "🏛️" },
      { label: "Woven & handmade", value: "woven", emoji: "🧶" },
    ],
  },
  {
    id: "priority",
    question: "What matters most in furniture?",
    options: [
      { label: "Timeless durability", value: "durability", emoji: "🛡️" },
      { label: "Statement design", value: "design", emoji: "💡" },
      { label: "Comfort above all", value: "comfort", emoji: "☁️" },
      { label: "Eco-friendly materials", value: "eco", emoji: "🌱" },
    ],
  },
];

const personalities: Record<string, { title: string; description: string; woods: string[]; emoji: string }> = {
  traditional: {
    title: "Classic Heritage",
    description: "You love timeless elegance and pieces that tell a story. Rich woods, warm tones, and carved details make your heart sing.",
    woods: ["Rosewood", "Teak Wood"],
    emoji: "👑",
  },
  modern: {
    title: "Contemporary Minimalist",
    description: "Clean lines, functional beauty, and understated sophistication define your taste. You believe less is more.",
    woods: ["Sheesham Wood", "Teak Wood"],
    emoji: "✨",
  },
  rustic: {
    title: "Natural Artisan",
    description: "You crave authenticity and the raw beauty of nature. Organic textures and handcrafted charm are your signature.",
    woods: ["Sheesham Wood", "Teak Wood"],
    emoji: "🌿",
  },
  luxury: {
    title: "Refined Connoisseur",
    description: "You appreciate the finer things — premium materials, impeccable craftsmanship, and furniture that makes a statement.",
    woods: ["Rosewood", "Teak Wood"],
    emoji: "💎",
  },
};

export function StylePersonalityQuiz() {
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

  const getPersonality = () => {
    const scores: Record<string, number> = {};
    Object.values(answers).forEach((v) => {
      Object.keys(personalities).forEach((key) => {
        if (!scores[key]) scores[key] = 0;
      });
    });
    // Simple scoring based on first answer (vibe) as primary driver
    const vibe = answers.vibe || "traditional";
    return personalities[vibe] || personalities.traditional;
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setShowResults(false);
  };

  const progress = showResults ? 100 : ((step + (answers[questions[step]?.id] ? 1 : 0)) / questions.length) * 100;

  return (
    <div>
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-3">
          <Palette className="h-3 w-3 mr-1" /> Style Personality
        </Badge>
        <h2 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
          Discover Your Furniture Style
        </h2>
        <p className="text-muted-foreground mt-2">Find out which design aesthetic matches your personality</p>
      </div>

      <div className="max-w-2xl mx-auto mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {showResults ? "Your style revealed!" : `Question ${step + 1} of ${questions.length}`}
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
              {(() => {
                const p = getPersonality();
                return (
                  <div className="text-center space-y-6">
                    <div className="text-6xl">{p.emoji}</div>
                    <h3 className="text-2xl font-bold text-foreground">You're a "{p.title}"</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">{p.description}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="text-sm text-muted-foreground">Recommended woods:</span>
                      {p.woods.map((w) => (
                        <Badge key={w} variant="outline">{w}</Badge>
                      ))}
                    </div>
                    <Button variant="outline" onClick={reset}>
                      <RotateCcw className="h-4 w-4 mr-1" /> Retake Quiz
                    </Button>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
