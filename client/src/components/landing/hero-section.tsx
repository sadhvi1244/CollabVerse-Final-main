"use client";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles, Shield } from "lucide-react";
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card01";
import { Spotlight } from "@/components/ui/spotlight";

const SplineSceneBasic = () => {
  const [, navigate] = useLocation();
  const isLoggedIn = false; // Replace with actual auth logic

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <Card className="w-full h-screen bg-black/[0.96] relative overflow-hidden">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />

      <div className="flex h-full">
        {/* Left content */}
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <motion.div
            className="mx-auto max-w-4xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="mb-6 inline-flex items-center rounded-full bg-white/20 px-4 py-2 backdrop-blur-md"
            >
              <span className="mr-2 rounded-full bg-brand-400 p-1">
                <Sparkles size={14} className="text-white" />
              </span>
              <span className="text-sm font-medium text-brand-100 text-white/80">
                Revolutionizing Digital Collaboration
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className={cn(
                "bg-gradient-to-b from-white to-gray-300 bg-clip-text text-3xl font-bold text-transparent md:text-5xl",
                "mb-6 tracking-tight [text-wrap:balance]"
              )}
            >
              Transform Ideas into Reality{" "}
              <span className="text-brand-300">Together</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mb-8 text-lg text-gray-300 md:text-md"
            >
              Join our innovative platform where collaboration meets
              verification.
              <p>
                Build groundbreaking projects with talented creators worldwide{" "}
              </p>
              and secure your contributions with next-gen blockchain
              credentials.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Link href="/auth">
                <Button
                  size="lg"
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-brand-400 to-brand-500 px-8 py-6 text-lg font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/25"
                >
                  <span className="relative z-10 flex items-center">
                    Get Started Now
                    <ArrowRight size={18} className="ml-2" />
                  </span>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-500 to-brand-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Button>
              </Link>

              <Link href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="group rounded-full border-white/20 bg-white/5 px-8 py-6 text-lg font-medium text-white backdrop-blur-lg transition-all duration-300 hover:bg-white/10 hover:shadow-lg"
                >
                  <span className="flex items-center">
                    <Shield size={18} className="mr-2 opacity-70" />
                    Learn more
                  </span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Right content */}
        <div className="flex-1 relative">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Animated background elements */}
      <motion.div
        className="absolute left-1/5 top-1/4 h-32 w-32 rounded-full bg-gradient-to-r from-brand-300 to-brand-500 opacity-20 blur-3xl"
        animate={{
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute left-3/4 top-2/3 h-24 w-24 rounded-full bg-gradient-to-r from-brand-200 to-brand-400 opacity-15 blur-2xl"
        animate={{
          y: [0, -30, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </Card>
  );
};

export default SplineSceneBasic;
