'use client';

import { create } from 'zustand';
import { ParsedJob, SearchPreferences, User, BaseResume, AIGeneratedArtifacts, JobFilters } from '@/types';

interface AppState {
  user: User | null;
  searchPreferences: SearchPreferences;
  baseResume: BaseResume | null;
  jobs: ParsedJob[];
  selectedJob?: ParsedJob;
  generatedArtifacts: AIGeneratedArtifacts | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSearchPreferences: (preferences: SearchPreferences) => void;
  setBaseResume: (resume: BaseResume | null) => void;
  setJobs: (jobs: ParsedJob[]) => void;
  setSelectedJob: (job: ParsedJob | undefined) => void;
  setGeneratedArtifacts: (artifacts: AIGeneratedArtifacts | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const useAppStore = create<AppState>((set) => ({
  // State
  user: null,
  searchPreferences: {
    grade: 'Middle',
    minSalary: 100000,
    maxSalary: 250000,
    location: 'Москва',
    techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    remoteOnly: false,
    experienceYears: 3,
    updatedAt: new Date().toISOString(),
  },
  baseResume: null,
  jobs: [],
  selectedJob: undefined,
  generatedArtifacts: null,
  isLoading: false,
  error: null,
  
  // Actions
  setUser: (user) => set({ user }),
  setSearchPreferences: (preferences) => set({ searchPreferences: preferences }),
  setBaseResume: (resume) => set({ baseResume: resume }),
  setJobs: (jobs) => set({ jobs }),
  setSelectedJob: (job) => set({ selectedJob: job }),
  setGeneratedArtifacts: (artifacts) => set({ generatedArtifacts: artifacts }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set({
    user: null,
    baseResume: null,
    jobs: [],
    selectedJob: undefined,
    generatedArtifacts: null,
    isLoading: false,
    error: null,
  }),
}));

export { useAppStore };
