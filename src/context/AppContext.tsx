import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ExamResultRecord,
  LearningStage,
  MistakeRecord,
  PageId,
  StudentProfile,
} from '../types/curriculum';
import { ACHIEVEMENT_BADGES, LEVELS } from '../data/curriculum';
import {
  STAGE_BY_ID,
  STAGE_BY_NUMBER,
  STAGES_400,
  STAGES_BY_LESSON_ID,
  STAGES_BY_LEVEL,
  TOTAL_STAGES_COUNT,
} from '../data/stages400';

const PROFILES_KEY = 'english_master_profiles_v1';
const ACTIVE_ID_KEY = 'english_master_active_profile_id_v1';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createDefaultProfile(name: string, isGuest: boolean): StudentProfile {
  return {
    id: `prof_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || (isGuest ? 'زائر' : 'طالب جديد'),
    isGuest,
    createdAt: new Date().toISOString(),
    xp: 0,
    stars: 0,
    streakDays: 1,
    lastActiveDate: todayIsoDate(),
    completedLessonIds: [],
    completedStageIds: [],
    passedLevelIds: [],
    unlockedLevelId: 1,
    lastVisitedLessonId: null,
    lastVisitedStageId: 'stage-1',
    favoriteWordIds: [],
    learnedWordIds: [],
    mistakes: [],
    examHistory: [],
    unlockedBadgeIds: [],
    dailyLessonsToday: 0,
    dailyGamesToday: 0,
    gamesWonCount: 0,
    settings: {
      theme: 'light',
      speechRate: 0.92,
      voiceAccent: 'en-US',
      strictProgression: true,
      fontSize: 'large',
      soundEffects: true,
    },
  };
}

function normalizeProfile(p: StudentProfile): StudentProfile {
  return {
    ...p,
    completedStageIds: Array.isArray(p.completedStageIds) ? p.completedStageIds : [],
    lastVisitedStageId: p.lastVisitedStageId ?? 'stage-1',
    settings: {
      ...p.settings,
      fontSize: p.settings?.fontSize ?? 'large',
      soundEffects: p.settings?.soundEffects ?? true,
    },
  };
}

function evaluateBadges(profile: StudentProfile): { unlockedBadgeIds: string[]; bonusXp: number } {
  const existing = new Set(profile.unlockedBadgeIds);
  let bonusXp = 0;

  const grant = (badgeId: string) => {
    if (!existing.has(badgeId)) {
      existing.add(badgeId);
      const badge = ACHIEVEMENT_BADGES.find((b) => b.id === badgeId);
      if (badge) bonusXp += badge.xpReward;
    }
  };

  if (profile.completedLessonIds.length >= 1 || (profile.completedStageIds?.length ?? 0) >= 1) {
    grant('first-lesson');
  }
  if (profile.passedLevelIds.includes(1)) grant('level-1-master');
  if (profile.learnedWordIds.length >= 25) grant('vocab-25');
  if (profile.gamesWonCount >= 5) grant('game-winner-5');
  if (profile.streakDays >= 3) grant('streak-3');
  if (profile.passedLevelIds.includes(3)) grant('level-3-master');
  if ([1, 2, 3, 4, 5, 6].every((lvl) => profile.passedLevelIds.includes(lvl))) {
    grant('polyglot-graduate');
  }

  return { unlockedBadgeIds: Array.from(existing), bonusXp };
}

export type NextStageTarget =
  | { type: 'stage'; stage: LearningStage }
  | { type: 'checkpoint'; levelId: number }
  | { type: 'completed-all' };

interface AppContextValue {
  profiles: StudentProfile[];
  activeProfile: StudentProfile | null;
  currentPage: PageId;
  selectedLevelId: number;
  selectedLessonId: string;
  selectedStageId: string;
  selectedGameId: number | null;
  navigate: (
    page: PageId,
    opts?: { levelId?: number; lessonId?: string; stageId?: string; gameId?: number | null }
  ) => void;
  loginOrCreateProfile: (name: string, isGuest?: boolean) => void;
  selectExistingProfile: (profileId: string) => void;
  logoutToAuth: () => void;
  addXp: (amount: number, starsDelta?: number) => void;
  completeLesson: (lessonId: string) => void;
  visitLesson: (lessonId: string) => void;
  completeStage: (stageId: string) => void;
  visitStage: (stageId: string) => void;
  toggleFavoriteWord: (wordId: string) => void;
  toggleLearnedWord: (wordId: string) => void;
  recordMistake: (mistake: Omit<MistakeRecord, 'mistakeCount' | 'lastMissedAt'>) => void;
  resolveMistake: (mistakeId: string) => void;
  recordGameWin: (xpEarned: number, starsEarned?: number) => void;
  saveExamResult: (result: ExamResultRecord, passedLevelId?: number) => boolean;
  isLevelUnlocked: (levelId: number) => boolean;
  isLevelLessonsCompleted: (levelId: number) => boolean;
  isLessonUnlocked: (lessonId: string) => boolean;
  isStageCompleted: (stageId: string) => boolean;
  isStageUnlocked: (stageNumber: number) => boolean;
  getCurrentActiveStage: () => NextStageTarget;
  getNextStageAfter: (stageId: string) => NextStageTarget;
  updateSettings: (partial: Partial<StudentProfile['settings']>) => void;
  resetActiveProgress: () => void;
  exportProgressJson: () => string;
  importProgressJson: (jsonText: string) => { ok: boolean; messageAr: string };
  completionPercentage: number;
  completedStagesCount: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<StudentProfile[]>(() => {
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StudentProfile[];
      return Array.isArray(parsed) ? parsed.map(normalizeProfile) : [];
    } catch {
      return [];
    }
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_ID_KEY);
    } catch {
      return null;
    }
  });

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? null,
    [profiles, activeId]
  );

  const [currentPage, setCurrentPage] = useState<PageId>(() =>
    activeProfile ? 'home' : 'welcome'
  );
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('l1-alphabet');
  const [selectedStageId, setSelectedStageId] = useState<string>(
    () => activeProfile?.lastVisitedStageId || 'stage-1'
  );
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch {
      // ignore storage quota
    }
  }, [profiles]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_ID_KEY, activeId);
      else localStorage.removeItem(ACTIVE_ID_KEY);
    } catch {
      // ignore
    }
  }, [activeId]);

  useEffect(() => {
    const theme = activeProfile?.settings.theme ?? 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const fontSize = activeProfile?.settings.fontSize ?? 'large';
    document.documentElement.dataset.fontSize = fontSize;
  }, [activeProfile?.settings.theme, activeProfile?.settings.fontSize]);

  const completedStageSet = useMemo(
    () => new Set(activeProfile?.completedStageIds ?? []),
    [activeProfile?.completedStageIds]
  );

  const completedLessonSet = useMemo(
    () => new Set(activeProfile?.completedLessonIds ?? []),
    [activeProfile?.completedLessonIds]
  );

  const passedLevelSet = useMemo(
    () => new Set(activeProfile?.passedLevelIds ?? []),
    [activeProfile?.passedLevelIds]
  );

  const updateActiveProfile = useCallback(
    (updater: (prev: StudentProfile) => StudentProfile) => {
      if (!activeId) return;
      setProfiles((prevList) =>
        prevList.map((p) => {
          if (p.id !== activeId) return p;
          const today = todayIsoDate();
          let updated = updater(p);

          if (updated.lastActiveDate !== today) {
            const prevTime = new Date(updated.lastActiveDate).getTime();
            const nowTime = new Date(today).getTime();
            const diffDays = Math.round((nowTime - prevTime) / (1000 * 60 * 60 * 24));
            updated = {
              ...updated,
              streakDays: diffDays === 1 ? updated.streakDays + 1 : 1,
              lastActiveDate: today,
              dailyLessonsToday: 0,
              dailyGamesToday: 0,
            };
          }

          const { unlockedBadgeIds, bonusXp } = evaluateBadges(updated);
          if (bonusXp > 0 || unlockedBadgeIds.length !== updated.unlockedBadgeIds.length) {
            updated = {
              ...updated,
              unlockedBadgeIds,
              xp: updated.xp + bonusXp,
            };
          }
          return updated;
        })
      );
    },
    [activeId]
  );

  useEffect(() => {
    try {
      window.history.replaceState(
        {
          page: currentPage,
          levelId: selectedLevelId,
          lessonId: selectedLessonId,
          stageId: selectedStageId,
          gameId: selectedGameId,
        },
        ''
      );
    } catch {
      // ignore history errors in restricted frames
    }
    const onPopState = (event: PopStateEvent) => {
      const st = event.state as {
        page?: PageId;
        levelId?: number;
        lessonId?: string;
        stageId?: string;
        gameId?: number | null;
      } | null;
      if (!st || !st.page) return;
      if (st.levelId !== undefined) setSelectedLevelId(st.levelId);
      if (st.lessonId !== undefined) setSelectedLessonId(st.lessonId);
      if (st.stageId !== undefined) setSelectedStageId(st.stageId);
      if (st.gameId !== undefined) setSelectedGameId(st.gameId);
      setCurrentPage(st.page);
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback(
    (
      page: PageId,
      opts?: { levelId?: number; lessonId?: string; stageId?: string; gameId?: number | null }
    ) => {
      const nextLevelId = opts?.levelId !== undefined ? opts.levelId : selectedLevelId;
      const nextLessonId = opts?.lessonId !== undefined ? opts.lessonId : selectedLessonId;
      const nextStageId = opts?.stageId !== undefined ? opts.stageId : selectedStageId;
      const nextGameId = opts?.gameId !== undefined ? opts.gameId : selectedGameId;

      if (opts?.levelId !== undefined) setSelectedLevelId(opts.levelId);
      if (opts?.lessonId !== undefined) setSelectedLessonId(opts.lessonId);
      if (opts?.stageId !== undefined) setSelectedStageId(opts.stageId);
      if (opts?.gameId !== undefined) setSelectedGameId(opts.gameId);
      setCurrentPage(page);

      try {
        window.history.pushState(
          {
            page,
            levelId: nextLevelId,
            lessonId: nextLessonId,
            stageId: nextStageId,
            gameId: nextGameId,
          },
          ''
        );
      } catch {
        // ignore history errors
      }
      window.scrollTo(0, 0);
    },
    [selectedLevelId, selectedLessonId, selectedStageId, selectedGameId]
  );

  const loginOrCreateProfile = useCallback(
    (name: string, isGuest = false) => {
      const existing = !isGuest
        ? profiles.find((p) => !p.isGuest && p.name.trim().toLowerCase() === name.trim().toLowerCase())
        : undefined;

      if (existing) {
        setActiveId(existing.id);
        setCurrentPage('home');
        return;
      }

      const fresh = createDefaultProfile(name, isGuest);
      setProfiles((prev) => [...prev, fresh]);
      setActiveId(fresh.id);
      setCurrentPage('home');
    },
    [profiles]
  );

  const selectExistingProfile = useCallback((profileId: string) => {
    setActiveId(profileId);
    setCurrentPage('home');
  }, []);

  const logoutToAuth = useCallback(() => {
    setActiveId(null);
    setCurrentPage('auth');
  }, []);

  const addXp = useCallback(
    (amount: number, starsDelta = 0) => {
      updateActiveProfile((p) => ({
        ...p,
        xp: Math.max(0, p.xp + amount),
        stars: Math.max(0, p.stars + starsDelta),
      }));
    },
    [updateActiveProfile]
  );

  const visitLesson = useCallback(
    (lessonId: string) => {
      updateActiveProfile((p) => ({
        ...p,
        lastVisitedLessonId: lessonId,
      }));
    },
    [updateActiveProfile]
  );

  const completeLesson = useCallback(
    (lessonId: string) => {
      updateActiveProfile((p) => {
        const alreadyDone = p.completedLessonIds.includes(lessonId);
        return {
          ...p,
          lastVisitedLessonId: lessonId,
          completedLessonIds: alreadyDone ? p.completedLessonIds : [...p.completedLessonIds, lessonId],
          xp: p.xp + (alreadyDone ? 10 : 40),
          stars: p.stars + (alreadyDone ? 0 : 1),
          dailyLessonsToday: p.dailyLessonsToday + (alreadyDone ? 0 : 1),
        };
      });
    },
    [updateActiveProfile]
  );

  const visitStage = useCallback(
    (stageId: string) => {
      updateActiveProfile((p) => {
        if (p.lastVisitedStageId === stageId) return p;
        return {
          ...p,
          lastVisitedStageId: stageId,
        };
      });
    },
    [updateActiveProfile]
  );

  const completeStage = useCallback(
    (stageId: string) => {
      const stage = STAGE_BY_ID.get(stageId);
      updateActiveProfile((p) => {
        const prevStages = p.completedStageIds ?? [];
        const alreadyDone = prevStages.includes(stageId);
        const nextStages = alreadyDone ? prevStages : [...prevStages, stageId];

        let nextLessons = p.completedLessonIds;
        if (stage) {
          const lessonStages = STAGES_BY_LESSON_ID.get(stage.sourceLessonId) ?? [];
          const stageSet = new Set(nextStages);
          const allLessonStagesDone =
            lessonStages.length > 0 && lessonStages.every((s) => stageSet.has(s.id));
          if (allLessonStagesDone && !nextLessons.includes(stage.sourceLessonId)) {
            nextLessons = [...nextLessons, stage.sourceLessonId];
          }
        }

        return {
          ...p,
          lastVisitedStageId: stageId,
          completedStageIds: nextStages,
          completedLessonIds: nextLessons,
          xp: p.xp + (alreadyDone ? 5 : 25),
          stars: p.stars + (alreadyDone ? 0 : 1),
          dailyLessonsToday: p.dailyLessonsToday + (alreadyDone ? 0 : 1),
        };
      });
    },
    [updateActiveProfile]
  );

  const toggleFavoriteWord = useCallback(
    (wordId: string) => {
      updateActiveProfile((p) => {
        const exists = p.favoriteWordIds.includes(wordId);
        return {
          ...p,
          favoriteWordIds: exists
            ? p.favoriteWordIds.filter((id) => id !== wordId)
            : [...p.favoriteWordIds, wordId],
        };
      });
    },
    [updateActiveProfile]
  );

  const toggleLearnedWord = useCallback(
    (wordId: string) => {
      updateActiveProfile((p) => {
        const exists = p.learnedWordIds.includes(wordId);
        return {
          ...p,
          learnedWordIds: exists
            ? p.learnedWordIds.filter((id) => id !== wordId)
            : [...p.learnedWordIds, wordId],
          xp: exists ? p.xp : p.xp + 5,
        };
      });
    },
    [updateActiveProfile]
  );

  const recordMistake = useCallback(
    (mistake: Omit<MistakeRecord, 'mistakeCount' | 'lastMissedAt'>) => {
      updateActiveProfile((p) => {
        const idx = p.mistakes.findIndex((m) => m.id === mistake.id);
        const now = new Date().toISOString();
        if (idx >= 0) {
          const updated = [...p.mistakes];
          updated[idx] = {
            ...updated[idx],
            mistakeCount: updated[idx].mistakeCount + 1,
            lastMissedAt: now,
          };
          return { ...p, mistakes: updated };
        }
        return {
          ...p,
          mistakes: [
            {
              ...mistake,
              mistakeCount: 1,
              lastMissedAt: now,
            },
            ...p.mistakes,
          ],
        };
      });
    },
    [updateActiveProfile]
  );

  const resolveMistake = useCallback(
    (mistakeId: string) => {
      updateActiveProfile((p) => ({
        ...p,
        mistakes: p.mistakes.filter((m) => m.id !== mistakeId),
        xp: p.xp + 10,
      }));
    },
    [updateActiveProfile]
  );

  const recordGameWin = useCallback(
    (xpEarned: number, starsEarned = 1) => {
      updateActiveProfile((p) => ({
        ...p,
        xp: p.xp + xpEarned,
        stars: p.stars + starsEarned,
        gamesWonCount: p.gamesWonCount + 1,
        dailyGamesToday: p.dailyGamesToday + 1,
      }));
    },
    [updateActiveProfile]
  );

  const saveExamResult = useCallback(
    (result: ExamResultRecord, passedLevelId?: number): boolean => {
      let unlockedNext = false;
      updateActiveProfile((p) => {
        const passed = result.score >= 70;
        let passedLevelIds = p.passedLevelIds;
        let unlockedLevelId = p.unlockedLevelId;

        if (passed && passedLevelId) {
          if (!passedLevelIds.includes(passedLevelId)) {
            passedLevelIds = [...passedLevelIds, passedLevelId];
          }
          if (passedLevelId >= unlockedLevelId && passedLevelId < 6) {
            unlockedLevelId = passedLevelId + 1;
            unlockedNext = true;
          }
        }

        return {
          ...p,
          examHistory: [result, ...p.examHistory],
          passedLevelIds,
          unlockedLevelId,
          xp: p.xp + Math.round(result.score * 0.6),
          stars: p.stars + (passed ? 2 : 0),
        };
      });
      return unlockedNext;
    },
    [updateActiveProfile]
  );

  const isLevelUnlocked = useCallback(
    (levelId: number): boolean => {
      if (levelId === 1 || levelId === 7) return true;
      if (!activeProfile) return levelId === 1;
      if (!activeProfile.settings.strictProgression) return true;
      return levelId <= activeProfile.unlockedLevelId;
    },
    [activeProfile]
  );

  const isLevelLessonsCompleted = useCallback(
    (levelId: number): boolean => {
      if (!activeProfile) return false;
      const lvlStages = STAGES_BY_LEVEL[levelId] ?? [];
      return lvlStages.every((s) => completedStageSet.has(s.id));
    },
    [activeProfile, completedStageSet]
  );

  const isLessonUnlocked = useCallback(
    (lessonId: string): boolean => {
      const stages = STAGES_BY_LESSON_ID.get(lessonId);
      if (!stages || stages.length === 0) return true;
      if (!isLevelUnlocked(stages[0].levelId)) return false;
      if (!activeProfile?.settings.strictProgression) return true;
      if (completedLessonSet.has(lessonId)) return true;
      const firstStage = stages[0];
      if (firstStage.stageNumber === 1) return true;
      const prevStage = STAGE_BY_NUMBER.get(firstStage.stageNumber - 1);
      return prevStage ? completedStageSet.has(prevStage.id) : true;
    },
    [activeProfile, isLevelUnlocked, completedLessonSet, completedStageSet]
  );

  const isStageCompleted = useCallback(
    (stageId: string): boolean => completedStageSet.has(stageId),
    [completedStageSet]
  );

  const isStageUnlocked = useCallback(
    (stageNumber: number): boolean => {
      const stage = STAGE_BY_NUMBER.get(stageNumber);
      if (!stage) return false;
      if (!isLevelUnlocked(stage.levelId)) return false;
      if (!activeProfile || !activeProfile.settings.strictProgression) return true;
      if (completedStageSet.has(stage.id)) return true;
      if (stageNumber === 1) return true;
      const prev = STAGE_BY_NUMBER.get(stageNumber - 1);
      if (!prev) return true;
      if (prev.levelId < stage.levelId) {
        return isLevelUnlocked(stage.levelId);
      }
      return completedStageSet.has(prev.id);
    },
    [activeProfile, isLevelUnlocked, completedStageSet]
  );

  const getCurrentActiveStage = useCallback((): NextStageTarget => {
    if (!activeProfile) {
      return { type: 'stage', stage: STAGES_400[0] };
    }
    for (const level of LEVELS) {
      if (!isLevelUnlocked(level.id)) break;
      const lvlStages = STAGES_BY_LEVEL[level.id] ?? [];
      const nextStage = lvlStages.find((s) => !completedStageSet.has(s.id));
      if (nextStage) {
        return { type: 'stage', stage: nextStage };
      }
      if (!passedLevelSet.has(level.id)) {
        return { type: 'checkpoint', levelId: level.id };
      }
    }
    return { type: 'completed-all' };
  }, [activeProfile, isLevelUnlocked, completedStageSet, passedLevelSet]);

  const getNextStageAfter = useCallback(
    (stageId: string): NextStageTarget => {
      const current = STAGE_BY_ID.get(stageId);
      if (!current) return getCurrentActiveStage();

      const nextStage = STAGE_BY_NUMBER.get(current.stageNumber + 1);
      if (!nextStage) {
        if (!passedLevelSet.has(current.levelId)) {
          return { type: 'checkpoint', levelId: current.levelId };
        }
        return { type: 'completed-all' };
      }

      if (nextStage.levelId === current.levelId) {
        return { type: 'stage', stage: nextStage };
      }

      // Crossed a unit boundary
      if (
        !activeProfile?.settings.strictProgression ||
        passedLevelSet.has(current.levelId) ||
        isLevelUnlocked(nextStage.levelId)
      ) {
        return { type: 'stage', stage: nextStage };
      }

      return { type: 'checkpoint', levelId: current.levelId };
    },
    [activeProfile, getCurrentActiveStage, isLevelUnlocked, passedLevelSet]
  );

  const updateSettings = useCallback(
    (partial: Partial<StudentProfile['settings']>) => {
      updateActiveProfile((p) => ({
        ...p,
        settings: { ...p.settings, ...partial },
      }));
    },
    [updateActiveProfile]
  );

  const resetActiveProgress = useCallback(() => {
    if (!activeProfile) return;
    const fresh = createDefaultProfile(activeProfile.name, activeProfile.isGuest);
    fresh.id = activeProfile.id;
    fresh.settings = activeProfile.settings;
    setProfiles((prev) => prev.map((p) => (p.id === activeProfile.id ? fresh : p)));
  }, [activeProfile]);

  const exportProgressJson = useCallback(() => {
    if (!activeProfile) return '';
    return JSON.stringify(activeProfile, null, 2);
  }, [activeProfile]);

  const importProgressJson = useCallback((jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText) as StudentProfile;
      if (!parsed || typeof parsed.name !== 'string' || !Array.isArray(parsed.completedLessonIds)) {
        return { ok: false, messageAr: 'الملف لا يحتوي على بيانات طالب صالحة لتطبيق ENGLISH MASTER.' };
      }
      const imported = normalizeProfile({
        ...createDefaultProfile(parsed.name, Boolean(parsed.isGuest)),
        ...parsed,
        id: parsed.id || `prof_${Date.now()}`,
      });
      setProfiles((prev) => {
        const filtered = prev.filter((p) => p.id !== imported.id);
        return [...filtered, imported];
      });
      setActiveId(imported.id);
      setCurrentPage('home');
      return { ok: true, messageAr: `تمت استعادة تقدم الطالب "${imported.name}" بنجاح.` };
    } catch {
      return { ok: false, messageAr: 'تعذر قراءة الملف. تأكد من أنه ملف JSON سليم.' };
    }
  }, []);

  const completedStagesCount = activeProfile?.completedStageIds?.length ?? 0;
  const completionPercentage = Math.min(
    100,
    Math.round((completedStagesCount / TOTAL_STAGES_COUNT) * 100)
  );

  return (
    <AppContext.Provider
      value={{
        profiles,
        activeProfile,
        currentPage,
        selectedLevelId,
        selectedLessonId,
        selectedStageId,
        selectedGameId,
        navigate,
        loginOrCreateProfile,
        selectExistingProfile,
        logoutToAuth,
        addXp,
        completeLesson,
        visitLesson,
        completeStage,
        visitStage,
        toggleFavoriteWord,
        toggleLearnedWord,
        recordMistake,
        resolveMistake,
        recordGameWin,
        saveExamResult,
        isLevelUnlocked,
        isLevelLessonsCompleted,
        isLessonUnlocked,
        isStageCompleted,
        isStageUnlocked,
        getCurrentActiveStage,
        getNextStageAfter,
        updateSettings,
        resetActiveProgress,
        exportProgressJson,
        importProgressJson,
        completionPercentage,
        completedStagesCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
