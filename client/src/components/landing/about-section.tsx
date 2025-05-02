import { Users, Zap, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";

export function AboutSection() {
  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Building",
      description: "Connect with like-minded individuals and form powerful teams based on complementary skills and shared vision."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-Time Collaboration",
      description: "Work together synchronously with instant updates, live chat, and collaborative tools that keep everyone in sync."
    },
    {
      icon: <ClipboardCheck className="h-6 w-6" />,
      title: "Skill-Based Matching",
      description: "Find the perfect projects or team members through our intelligent skill-based matching system."
    }
  ];
  
  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="lg:text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-base font-semibold text-primary-600 tracking-wide uppercase">About CollabVerse</p>
          <h2 className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 dark:text-white font-inter sm:text-4xl">
            Collaborate Seamlessly, Build Efficiently
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
            CollabVerse is a real-time collaboration platform designed to connect creators with talented contributors to turn innovative ideas into reality.
          </p>
        </motion.div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white font-inter">{feature.title}</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-300 text-center">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
