import { Link } from "wouter";

export function Logo({ 
  size = "default", 
  variant = "default",
  className = ""
}: { 
  size?: "small" | "default" | "large",
  variant?: "default" | "white",
  className?: string
}) {
  const sizeClasses = {
    small: "h-6 w-6",
    default: "h-8 w-8",
    large: "h-10 w-10"
  };
  
  const fontSizeClasses = {
    small: "text-lg",
    default: "text-xl",
    large: "text-2xl"
  };
  
  const textColor = variant === "white" ? "text-white" : "text-gray-900 dark:text-white";
  const svgColor = variant === "white" ? "text-white" : "text-primary-600";
  
  return (
    <Link href="/">
      <div className={`flex items-center gap-2 cursor-pointer ${className}`}>
        <svg 
          className={`${sizeClasses[size]} ${svgColor}`} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M6 19C7.5 16.5 9.79086 15 12 15C14.2091 15 16.5 16.5 18 19" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span className={`font-bold ${fontSizeClasses[size]} font-inter ${textColor}`}>
          CollabVerse
        </span>
      </div>
    </Link>
  );
}
