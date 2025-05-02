import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    // Function to handle smooth scrolling for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if the clicked element is an anchor with a hash
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const id = target.getAttribute('href')?.substring(1);
        const element = document.getElementById(id as string);
        
        if (element) {
          // Smooth scroll to the element
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Optionally update the URL
          window.history.pushState(null, '', target.getAttribute('href') || '');
        }
      }
    };
    
    // Add event listener
    document.addEventListener('click', handleAnchorClick);
    
    // Add smooth scrolling to the entire document
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Setup scroll animations for sections
    const setupScrollAnimations = () => {
      const animatedElements = document.querySelectorAll('.scroll-animation');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px'
      });
      
      animatedElements.forEach(element => {
        observer.observe(element);
      });
    };
    
    // Run animations setup after a short delay to ensure DOM is ready
    setTimeout(setupScrollAnimations, 100);
    
    // Cleanup function
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);
  
  return null;
}
