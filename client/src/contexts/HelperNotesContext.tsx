import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HelperNotesContextType {
  showHelperNotes: boolean;
  toggleHelperNotes: () => void;
}

const HelperNotesContext = createContext<HelperNotesContextType>({
  showHelperNotes: true,
  toggleHelperNotes: () => {},
});

export function HelperNotesProvider({ children }: { children: ReactNode }) {
  const [showHelperNotes, setShowHelperNotes] = useState(() => {
    const stored = localStorage.getItem('ologywood_helper_notes');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('ologywood_helper_notes', String(showHelperNotes));
  }, [showHelperNotes]);

  const toggleHelperNotes = () => setShowHelperNotes((prev) => !prev);

  return (
    <HelperNotesContext.Provider value={{ showHelperNotes, toggleHelperNotes }}>
      {children}
    </HelperNotesContext.Provider>
  );
}

export function useHelperNotes() {
  return useContext(HelperNotesContext);
}
