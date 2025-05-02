import { motion } from "framer-motion";

export function ShowcaseSection() {
  const projects = [
    {
      name: "EcoTrack",
      type: "Sustainability App",
      description: "A team of environmental scientists and developers collaborated to create an app that helps users track and reduce their carbon footprint through personalized recommendations.",
      image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      technologies: ["React Native", "Node.js", "AI"],
      teamSize: 6,
      duration: "3 months"
    },
    {
      name: "MindWave",
      type: "Mental Health Platform",
      description: "A therapist and a team of developers created a platform that connects people with mental health resources and offers anonymous peer support in a safe environment.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      technologies: ["Vue.js", "Python", "MongoDB"],
      teamSize: 4,
      duration: "5 months"
    }
  ];
  
  return (
    <section id="showcase" className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="lg:text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-base font-semibold text-primary-600 tracking-wide uppercase">Success Stories</p>
          <h2 className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 dark:text-white font-inter sm:text-4xl">
            Projects Built on CollabVerse
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
            Discover how teams have leveraged our platform to create amazing things together.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {projects.map((project, index) => (
            <motion.div 
              key={project.name}
              className="flex flex-col md:flex-row bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="md:w-2/5">
                <img 
                  className="h-full w-full object-cover" 
                  src={project.image} 
                  alt={`Project ${project.name} interface`} 
                />
              </div>
              <div className="p-6 md:w-3/5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-inter mb-2">{project.name}</h3>
                <p className="text-sm text-primary-600 font-medium mb-4">{project.type}</p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech) => (
                    <span 
                      key={tech} 
                      className="px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-medium dark:bg-primary-900 dark:text-primary-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Team size: {project.teamSize}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Built in {project.duration}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
