import * as React from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

export type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: Option[];
  selectedValues: Option[];
  onChange: (selectedItems: Option[]) => void;
  placeholder?: string;
  className?: string;
  createable?: boolean;
};

export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select items...",
  className,
  createable = false,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  
  // Filter options based on the search query
  const filteredOptions = query === ""
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(query.toLowerCase())
      );

  // Check if the current query could be a new option
  const selectables = createable
    ? filteredOptions.length > 0
      ? filteredOptions
      : query.trim() !== "" && !options.some(option => option.label.toLowerCase() === query.toLowerCase()) 
        ? [...filteredOptions, { value: query, label: query }]
        : filteredOptions
    : filteredOptions;

  // Handler for selecting/deselecting items
  const handleSelect = (option: Option) => {
    const isSelected = selectedValues.some(
      (item) => item.value === option.value
    );
    
    if (isSelected) {
      onChange(selectedValues.filter((item) => item.value !== option.value));
    } else {
      onChange([...selectedValues, option]);
    }
    
    // Keep focus in the input after selection
    inputRef.current?.focus();
  };

  // Function to create new option
  const handleCreateOption = (inputValue: string) => {
    const newOption = { value: inputValue, label: inputValue };
    if (!options.some(option => option.value === inputValue)) {
      onChange([...selectedValues, newOption]);
      setQuery("");
    }
  };

  // Handle key events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Backspace" && query === "" && selectedValues.length > 0) {
      onChange(selectedValues.slice(0, -1));
    }
    
    // Handle creating options with Enter key
    if (createable && e.key === "Enter" && query.trim() !== "" && !options.some(option => option.label.toLowerCase() === query.toLowerCase())) {
      e.preventDefault();
      handleCreateOption(query);
    }
  };

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <div
        className={cn(
          "flex flex-wrap gap-1.5 p-1.5 border rounded-md min-h-10 relative",
          selectedValues.length > 0 && "pl-2.5",
          className
        )}
        onClick={() => {
          inputRef.current?.focus();
          setIsOpen(true);
        }}
      >
        {selectedValues.map((option) => (
          <Badge
            key={option.value}
            variant="secondary"
            className="flex items-center gap-1 px-2"
          >
            {option.label}
            <X
              className="h-3.5 w-3.5 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option);
              }}
            />
          </Badge>
        ))}
        
        <CommandPrimitive>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            placeholder={selectedValues.length === 0 ? placeholder : ""}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-20 text-sm h-8"
          />
        </CommandPrimitive>
      </div>
      
      {isOpen && (
        <div className="absolute w-full z-50 mt-1">
          <Command className="w-full border rounded-md shadow-md">
            <CommandGroup>
              {selectables.length > 0 ? (
                selectables.map((option) => {
                  const isSelected = selectedValues.some(
                    (item) => item.value === option.value
                  );
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className={cn(
                        "flex items-center justify-center rounded-sm w-4 h-4 border",
                        isSelected ? "bg-primary border-primary" : "border-input"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span>{option.label}</span>
                      {createable && !options.some(o => o.value === option.value) && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          New
                        </Badge>
                      )}
                    </CommandItem>
                  );
                })
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No options found.
                </div>
              )}
            </CommandGroup>
          </Command>
        </div>
      )}
    </div>
  );
}