import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const InvestigationContext = createContext(null);

export function InvestigationProvider({ children }) {
  const [activeCase, setActiveCase] = useState({
    _id: 'default_case_001',
    caseNumber: 'STEIN-2026-001',
    title: 'Drug Market Investigation',
    status: 'ACTIVE',
    riskLevel: 'HIGH',
    leadIds: [],
  });
  const [casesList, setCasesList] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [investigationPath, setInvestigationPath] = useState(null);
  const [activeEvidence, setActiveEvidence] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const loadCases = async () => {
    try {
      const res = await api.getCases();
      if (res.data && res.data.length > 0) {
        setCasesList(res.data);
        // If current activeCase is default or missing in list, set to first real case
        const found = res.data.find(c => c.caseNumber === activeCase.caseNumber || c._id === activeCase._id);
        if (found) setActiveCase(found);
        else setActiveCase(res.data[0]);
      }
    } catch (err) {
      console.warn('Could not load cases list:', err.message);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const addEvidenceToCase = (item, caseId = activeCase?._id) => {
    const newItem = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      caseId,
      caseNumber: activeCase?.caseNumber || 'STEIN-2026-001',
      type: item.type || 'ENTITY',
      title: item.title || item.name || item.label || 'Investigation Evidence',
      details: item.details || item.description || item.text || JSON.stringify(item),
      raw: item,
    };
    setActiveEvidence(prev => [newItem, ...prev]);
    showToast(`Added "${newItem.title}" to Active Case ${newItem.caseNumber}`);
  };

  const selectEntity = (entity) => {
    setSelectedEntity(entity);
  };

  const selectEvidence = (evidence) => {
    setSelectedEvidence(evidence);
  };

  return (
    <InvestigationContext.Provider
      value={{
        activeCase,
        setActiveCase,
        casesList,
        setCasesList,
        selectedEntity,
        selectEntity,
        selectedEvidence,
        selectEvidence,
        investigationPath,
        setInvestigationPath,
        activeEvidence,
        addEvidenceToCase,
        toastMessage,
        showToast,
        loadCases,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl text-xs font-mono flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </InvestigationContext.Provider>
  );
}

export function useInvestigation() {
  const ctx = useContext(InvestigationContext);
  if (!ctx) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return ctx;
}
