"use client";
import { Card } from "@/components/ui/card";
import { Users, Briefcase, Shield, Zap, Award, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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

const FeaturesSection = () => {
  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Connect with Talent",
      description:
        "Find the perfect collaborators based on skills, experience, and shared interests to build your dream team.",
      color: "from-sky-500 to-indigo-600",
      lightColor: "bg-sky-50",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Accelerate Development",
      description:
        "Streamline workflows with intuitive collaboration tools designed to help teams execute projects efficiently.",
      color: "from-yellow-400 to-orange-500",
      lightColor: "bg-yellow-50",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Verify Contributions",
      description:
        "Secure immutable proof of your work with blockchain-verified NFTs that showcase your expertise and project history.",
      color: "from-emerald-500 to-teal-600",
      lightColor: "bg-emerald-50",
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Build Your Portfolio",
      description:
        "Showcase your completed projects and contributions to attract new opportunities and demonstrate your capabilities.",
      color: "from-violet-500 to-fuchsia-600",
      lightColor: "bg-violet-50",
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Access Resources",
      description:
        "Leverage shared tools, templates, and frameworks that help your team deliver professional results faster.",
      color: "from-pink-500 to-rose-600",
      lightColor: "bg-pink-50",
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Grow Your Network",
      description:
        "Expand your professional connections through successful collaborations and community engagement.",
      color: "from-cyan-500 to-teal-500",
      lightColor: "bg-cyan-50",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
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

  const titleWords = "Everything You Need to Collaborate Effectively".split(
    " "
  );

  return (
    <section className="relative py-24 bg-gradient-to-b from-zinc-200 to-white dark:bg-neutral-950 overflow-hidden">
      {/* Floating Paths Background */}
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center justify-center mb-4 px-4 py-1.5 rounded-full bg-blue-200/40 dark:bg-white/30 text-brand-600 dark:text-white text-sm font-medium">
            <span className="mr-2">⚡</span>
            Platform Features
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-8 tracking-tighter">
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
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-r  from-black to-black/80 dark:from-zinc-900 dark:to-zinc-700/80"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            Our comprehensive platform provides all the tools and resources you
            need to bring your projects to life with the right team.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="bg-zinc-50 dark:bg-neutral-900 p-8 rounded-xl border border-gray-300 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 h-full relative overflow-hidden group">
                {/* Opposite gradient for light and dark themes */}
                <div
                  className={`absolute top-0 right-0 h-32 w-32 -mr-8 -mt-8 rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-500 
         bg-gradient-to-b from-zinc/10 to-zinc/10 dark:from-white/10 dark:to-white/10 opacity-5 dark:opacity-10`}
                />
                {/* Icon section */}
                <div
                  className={`w-12 h-12 rounded-lg ${feature.lightColor} dark:bg-white/10 flex items-center justify-center mb-5 text-brand-600 dark:text-white shadow-sm`}
                >
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div
            className="inline-block group relative bg-gradient-to-b from-neutral-900/10 to-neutral-100/10 dark:from-neutral-100/10 dark:to-neutral-900/10
 p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <Button
              variant="ghost"
              className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md bg-white/95 hover:bg-white/100 dark:bg-black/95 dark:hover:bg-black/100 text-black dark:text-white transition-all duration-300 group-hover:-translate-y-0.5 border border-black/10 dark:border-white/10 hover:shadow-md dark:hover:shadow-neutral-800/50"
            >
              <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                Explore All Features
              </span>
              <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300">
                →
              </span>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
