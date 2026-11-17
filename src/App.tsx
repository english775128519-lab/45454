/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/AppShell';
import { WelcomePage } from './pages/WelcomePage';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import {
  LessonDetailPage,
  LessonsPage,
  LevelsPage,
} from './pages/LevelsAndLessonsPages';
import { StagePlayerPage } from './pages/StagePlayerPage';
import { GamesPage } from './pages/GamesPage';
import { AITutorPage } from './pages/AITutorPage';
import { VoiceChatPage } from './pages/VoiceChatPage';
import { PronunciationPage } from './pages/PronunciationPage';
import { DictionaryPage } from './pages/DictionaryPage';
import { ExamsPage } from './pages/ExamsPage';
import { ReviewPage } from './pages/ReviewPage';
import {
  AchievementsPage,
  ProgressPage,
  SettingsPage,
} from './pages/AchievementsProgressSettingsPages';

const RouterView: React.FC = () => {
  const { currentPage, activeProfile } = useApp();

  if (currentPage === 'welcome') {
    return <WelcomePage />;
  }
  if (currentPage === 'auth' || !activeProfile) {
    return <AuthPage />;
  }

  const renderInnerPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'levels':
        return <LevelsPage />;
      case 'lessons':
        return <LessonsPage />;
      case 'lesson-detail':
        return <LessonDetailPage />;
      case 'stage-player':
        return <StagePlayerPage />;
      case 'games':
        return <GamesPage />;
      case 'ai-tutor':
        return <AITutorPage />;
      case 'voice-chat':
        return <VoiceChatPage />;
      case 'pronunciation':
        return <PronunciationPage />;
      case 'dictionary':
        return <DictionaryPage />;
      case 'exams':
        return <ExamsPage />;
      case 'review':
        return <ReviewPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'progress':
        return <ProgressPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return <AppShell>{renderInnerPage()}</AppShell>;
};

export default function App() {
  return (
    <AppProvider>
      <RouterView />
    </AppProvider>
  );
}
