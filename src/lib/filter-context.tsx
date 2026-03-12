'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface FilterContextValue {
  selectedModels: string[];
  setSelectedModels: (models: string[]) => void;
}

const FilterContext = createContext<FilterContextValue>({
  selectedModels: [],
  setSelectedModels: () => {},
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  return (
    <FilterContext.Provider value={{ selectedModels, setSelectedModels }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext(): FilterContextValue {
  return useContext(FilterContext);
}
