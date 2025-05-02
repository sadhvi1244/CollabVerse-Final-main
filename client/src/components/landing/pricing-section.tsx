("use client");
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Check, Star, ArrowRight } from "lucide-react";

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full text-slate-950 dark:text-white"
        viewBox="0 0 696 316"
        fill="none"
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

const PricingSection = () => {
  const [, navigate] = useLocation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 70 },
    },
  };

  const titleWords = "Pricing That Scales With Your Ambitions".split(" ");

  // ... keep the feature arrays and other constants the same ...
  const freePlanFeatures = [
    "Create or join 5 active project",
    "Basic collaboration tools",
    "Limited calendar integration",
    "Public team access",
    "Community support",
  ];

  const proPlanFeatures = [
    "Up to 5 simultaneous projects",
    "Advanced collaboration suite",
    "Full ai summerizer & automation",
    "Premium NFT proof generation",
    "Analytics dashboard",
    "Priority support with 24hr response",
  ];

  return (
    <section className="py-24 relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center mb-4 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-white text-sm font-medium backdrop-blur-sm"
          >
            <Star className="w-4 h-4 mr-2" />
            Flexible Plans
          </motion.div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-8 tracking-tighter">
            {titleWords.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80 dark:from-white dark:to-white/80"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Start building for free and upgrade only when you're ready to take
            your collaborations to the next level
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {/* Free Plan Card */}
          <motion.div variants={itemVariants}>
            <div className="bg-white dark:bg-neutral-900 shadow-md border border-gray-200 dark:border-neutral-800 rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-neutral-700 to-transparent" />

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Free Plan
              </h3>
              <div className="flex items-end mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ₹0
                </span>
                <span className="text-gray-500 dark:text-neutral-400 ml-2 mb-1">
                  /month
                </span>
              </div>
              <p className="text-gray-600 dark:text-neutral-400 mb-6">
                Perfect for exploring and joining your first projects
              </p>

              <ul className="space-y-3">
                {freePlanFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    variants={itemVariants}
                  >
                    <span className="mr-2 mt-1 flex-shrink-0 rounded-full p-1 bg-gray-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="text-gray-700 dark:text-neutral-300">
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-8">
                <div className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10 dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 w-full">
                  <Link href="/auth">
                    <Button
                      variant="ghost"
                      className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md bg-white/95 hover:bg-white/100 dark:bg-neutral-800/95 dark:hover:bg-neutral-800/100 text-black dark:text-white w-full transition-all duration-300 group-hover:-translate-y-0.5 border border-black/10 dark:border-neutral-700 hover:shadow-md"
                    >
                      <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                        Get Started
                      </span>
                      <ArrowRight className="ml-2 w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pro Plan Card */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-white dark:from-neutral-900 to-blue-50 dark:to-blue-900/20 shadow-lg border border-blue-200 dark:border-blue-800 rounded-2xl p-8 h-full relative overflow-hidden">
              <motion.div
                className="absolute -right-12 top-8 bg-blue-500 text-white text-xs font-bold px-10 py-1 rotate-45"
                animate={{ rotate: [45, 50, 45] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                POPULAR
              </motion.div>

              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400/50 via-blue-500 to-blue-400/50" />
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Pro Plan
              </h3>
              <div className="flex items-end mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ₹199
                </span>
                <span className="text-gray-500 dark:text-neutral-400 ml-2 mb-1">
                  /month
                </span>
              </div>
              <p className="text-gray-600 dark:text-neutral-400 mb-6">
                For serious creators and expanding your collaboration network
              </p>

              <ul className="space-y-3 relative z-10">
                {proPlanFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    variants={itemVariants}
                  >
                    <span className="mr-2 mt-1 flex-shrink-0 rounded-full p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="text-gray-700 dark:text-neutral-300">
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-8">
                <div className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10 dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 w-full">
                  <Link href="/auth">
                    <Button
                      variant="ghost"
                      className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md bg-white/95 hover:bg-white/100 dark:bg-blue-800/95 dark:hover:bg-blue-800/100 text-black dark:text-white w-full transition-all duration-300 group-hover:-translate-y-0.5 border border-black/10 dark:border-blue-700 hover:shadow-md"
                    >
                      <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                        Join Waitlist
                      </span>
                      <ArrowRight className="ml-2 w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <div className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10 dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 p-4 rounded-2xl bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md">
              <span className="text-gray-600 dark:text-neutral-400">
                Need a custom plan for your team?
              </span>
              <Button
                variant="link"
                onClick={() => navigate("/enterprise")}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Contact us about Enterprise options
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
