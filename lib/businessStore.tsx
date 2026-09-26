'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BusinessInputs } from './types';
import { DEMO_BUSINESS } from './mockData';

const STORAGE_KEY = 'bizpilot_business_inputs_v1';

interface BusinessContextValue {
  business: BusinessInputs;
  setBusiness: (b: BusinessInputs) => void;
  resetToDemo: () => void;
  hydrated: boolean;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusinessState] = useState<BusinessInputs>(DEMO_BUSINESS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setBusinessState(JSON.parse(raw));
    } catch (e) {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  const setBusiness = (b: BusinessInputs) => {
    setBusinessState(b);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
    } catch (e) {
      // ignore quota errors in demo
    }
  };

  const resetToDemo = () => setBusiness(DEMO_BUSINESS);

  return (
    <BusinessContext.Provider value={{ business, setBusiness, resetToDemo, hydrated }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
