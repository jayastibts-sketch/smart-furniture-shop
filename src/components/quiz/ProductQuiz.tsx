import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Sparkles, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; value: string; emoji: string }[];
}

const questions: QuizQuestion[] = [
  {
    id: "room",
    question: "Which room are you furnishing?",
    options: [
      { label: "Living Room", value: "living", emoji: "🛋️" },
      { label: "Bedroom", value: "bedroom", emoji: "🛏️" },
      { label: "Dining Room", value: "dining", emoji: "🍽️" },
      { label: "Home Office", value: "office", emoji: "💼" },
    ],
  },
  {
    id: "style",
    question: "What style do you prefer?",
    options: [
      { label: "Classic & Traditional", value: "classic", emoji: "🏛️" },
      { label: "Modern & Minimal", value: "modern", emoji: "✨" },
      { label: "Rustic & Natural", value: "rustic", emoji: "🌿" },
      { label: "Elegant & Carved", value: "elegant", emoji: "👑" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget range?",
    options: [
      { label: "Under ₹10,000", value: "low", emoji: "💰" },
      { label: "₹10,000 – ₹25,000", value: "mid", emoji: "💳" },
      { label: "₹25,000 – ₹50,000", value: "high", emoji: "💎" },
      { label: "₹50,000+", value: "premium", emoji: "🏆" },
    ],
  },
  {
    id: "wood",
    question: "Which wood type appeals to you?",
    options: [
      { label: "Teak Wood", value: "Teak Wood", emoji: "🪵" },
      { label: "Rosewood", value: "Rosewood", emoji: "🌹" },
      { label: "Sheesham Wood", value: "Sheesham Wood", emoji: "🌳" },
      { label: "Any / No Preference", value: "any", emoji: "🤷" },
    ],
  },
];

const budgetRanges: Record<string, [number, number]> = {
  low: [0, 10000],
  mid: [10000, 25000],
  high: [25000, 50000],
  premium: [50000, Infinity],
};

interface ProductQuizProps {
  products: Array<{
    id: string;
    name: string;
    price: number;
    image_url?: string | null;
    category_id?: string | null;
    material?: string | null;
    slug: string;
  }>;
  categories: Array<{ id: string; slug: string }>;
}

export function ProductQuiz({ products, categories }: ProductQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const getRecommendations = () => {
    const roomSlug = answers.room;
    const budget = answers.budget;
    const wood = answers.wood;

    const matchingCategory = categories.find((c) => c.slug === roomSlug || c.slug === `${roomSlug}-room`);
    const [minPrice, maxPrice] = budgetRanges[budget] || [0, Infinity];

    return products
      .filter((p) => {
        let score = 0;
        if (matchingCategory && p.category_id === matchingCategory.id) score += 3;
        if (p.price >= minPrice && p.price <= maxPrice) score += 2;
        if (wood !== "any" && p.material === wood) score += 2;
        return score > 0;
      })
      .sort((a, b) => {
        const scoreA = (matchingCategory && a.category_id === matchingCategory.id ? 3 : 0) +
          (a.price >= minPrice && a.price <= maxPrice ? 2 : 0) +
          (wood !== "any" && a.material === wood ? 2 : 0);
        const scoreB = (matchingCategory && b.category_id === matchingCategory.id ? 3 : 0) +
          (b.price >= minPrice && b.price <= maxPrice ? 2 : 0) +
          (wood !== "any" && b.material === wood ? 2 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 4);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setShowResults(false);
  };

  const progress = showResults ? 100 : ((step + (answers[questions[step]?.id] ? 1 : 0)) / questions.length) * 100;

  return (
    <section className="py-16 md:py-24 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">
            <Sparkles className="h-3 w-3 mr-1" /> Furniture Finder
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
            Find Your Perfect Piece
          </h2>
          <p className="text-muted-foreground mt-2">Answer a few questions and we'll recommend the best furniture for you</p>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {showResults ? "Done!" : `Question ${step + 1} of ${questions.length}`}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-semibold text-center mb-6">
                  {questions[step].question}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {questions[step].options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(questions[step].id, opt.value)}
                      className={`p-5 rounded-xl border-2 text-left transition-all hover:border-primary hover:shadow-md ${
                        answers[questions[step].id] === opt.value
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border bg-background"
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
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="text-xl font-semibold text-center mb-2">
                  🎉 Here are your top picks!
                </h3>
                <p className="text-center text-muted-foreground mb-6">
                  Based on your preferences, we recommend these pieces
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getRecommendations().map((p) => (
                    <Link to={`/products/${p.slug}`} key={p.id}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-[4/3] bg-muted">
                          {p.image_url && (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-foreground truncate">{p.name}</h4>
                          <p className="text-primary font-bold mt-1">₹{p.price.toLocaleString("en-IN")}</p>
                          {p.material && <p className="text-xs text-muted-foreground">{p.material}</p>}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
                {getRecommendations().length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No exact matches found. <Link to="/products" className="text-primary underline">Browse all products</Link>
                  </p>
                )}
                <div className="flex justify-center gap-3 mt-8">
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Retake Quiz
                  </Button>
                  <Link to="/products">
                    <Button>
                      Browse All <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
