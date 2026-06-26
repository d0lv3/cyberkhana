import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Download,
  Loader2,
  LockKeyhole,
  PlayCircle,
  TerminalSquare,
  BookOpen,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Button from '../components/ui/EnhancedButton';
import linuxCourse from '../data/linuxCourseData';
import quizzes from '../data/linuxQuizData';
import { decodeAnswer } from '../utils/quizCrypto';
import { userService } from '../services/userService';

type Lecture = {
  id: string;
  title: string;
  subtitle: string;
  videoId: string;
  duration: string;
  quiz: string | null;
  notes?: string[];
  resource?: string;
};

type CourseModule = {
  id: string;
  title: string;
  lectures: Lecture[];
};

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type ProgressState = {
  completedLectures: string[];
  solvedQuestions: Record<string, true>;
};

type QuizAttemptAnswer = {
  selectedOptionIndex: number;
  isCorrect: boolean;
};

type InlineFeedback = { type: 'success' | 'error' | ''; text: string };

const letters = ['A', 'B', 'C', 'D'];

const course = linuxCourse as { id: string; title: string; description: string; modules: CourseModule[] };
const quizBank = quizzes as Record<string, QuizQuestion[]>;

const toProgressState = (payload: any): ProgressState => {
  const completedLectures = Array.isArray(payload?.completedLectures)
    ? Array.from(new Set(payload.completedLectures.filter((item: unknown) => typeof item === 'string')))
    : [];

  const solvedQuestionsArray = Array.isArray(payload?.solvedQuestions)
    ? payload.solvedQuestions.filter((item: unknown) => typeof item === 'string')
    : [];

  const solvedQuestions = solvedQuestionsArray.reduce((acc: Record<string, true>, key: string) => {
    acc[key] = true;
    return acc;
  }, {});

  return {
    completedLectures,
    solvedQuestions,
  };
};

const serializeProgress = (progress: ProgressState) => ({
  completedLectures: Array.from(new Set(progress.completedLectures)),
  solvedQuestions: Object.keys(progress.solvedQuestions),
});

const LinuxCoursePage: React.FC = () => {
  const allLectures = useMemo(
    () => course.modules.flatMap((module) => module.lectures.map((lecture) => ({ module, lecture }))),
    []
  );

  const [progress, setProgress] = useState<ProgressState>({ completedLectures: [], solvedQuestions: {} });
  const [progressLoading, setProgressLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [activeLectureId, setActiveLectureId] = useState<string>(allLectures[0]?.lecture.id || '');
  
  // Quiz states
  const [questionIndexByLecture, setQuestionIndexByLecture] = useState<Record<string, number>>({});
  const [selectedOptionByLecture, setSelectedOptionByLecture] = useState<Record<string, number | undefined>>({});
  const [quizStartedByLecture, setQuizStartedByLecture] = useState<Record<string, boolean>>({});
  const [quizCompletedByLecture, setQuizCompletedByLecture] = useState<Record<string, boolean>>({});
  const [quizAnswersByLecture, setQuizAnswersByLecture] = useState<Record<string, Record<number, QuizAttemptAnswer>>>({});
  const [feedbackByLecture, setFeedbackByLecture] = useState<Record<string, InlineFeedback>>({});
  const [celebrationByLecture, setCelebrationByLecture] = useState<Record<string, number>>({});
  
  // Mobile layout state
  const [showTocMobile, setShowTocMobile] = useState(false);

  const hasAutoOpenRef = useRef(false);

  const persistProgress = async (next: ProgressState, previous: ProgressState = progress) => {
    setSavingProgress(true);
    setProgress(next);

    try {
      const saved = await userService.updateLinuxCourseProgress(serializeProgress(next));
      setProgress(toProgressState(saved));
      return true;
    } catch {
      setProgress(previous);
      return false;
    } finally {
      setSavingProgress(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadProgress = async () => {
      try {
        const serverProgress = await userService.getLinuxCourseProgress();
        if (!active) return;
        setProgress(toProgressState(serverProgress));
      } finally {
        if (active) {
          setProgressLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (progressLoading || hasAutoOpenRef.current) return;
    const firstIncomplete = allLectures.find((item) => !progress.completedLectures.includes(item.lecture.id));
    if (firstIncomplete) {
      setActiveLectureId(firstIncomplete.lecture.id);
    }
    hasAutoOpenRef.current = true;
  }, [progressLoading, allLectures, progress.completedLectures]);

  const getQuestions = (lecture: Lecture): QuizQuestion[] => {
    if (!lecture.quiz) return [];
    return quizBank[lecture.quiz] || [];
  };

  const getCorrectOptionIndex = (question: QuizQuestion): number => {
    const decodedLetter = (decodeAnswer(question.answer) || '').trim().toUpperCase();
    return letters.indexOf(decodedLetter);
  };

  const openLecture = (lecture: Lecture) => {
    setActiveLectureId(lecture.id);
    setShowTocMobile(false);

    if (lecture.quiz && questionIndexByLecture[lecture.id] === undefined) {
      setQuestionIndexByLecture((prev) => ({
        ...prev,
        [lecture.id]: 0,
      }));
    }
  };

  const startQuizAttempt = (lecture: Lecture) => {
    const questions = getQuestions(lecture);
    if (questions.length === 0) return;

    setQuizStartedByLecture((prev) => ({ ...prev, [lecture.id]: true }));
    setQuizCompletedByLecture((prev) => ({ ...prev, [lecture.id]: false }));
    setQuizAnswersByLecture((prev) => ({ ...prev, [lecture.id]: {} }));
    setQuestionIndexByLecture((prev) => ({ ...prev, [lecture.id]: 0 }));
    setSelectedOptionByLecture((prev) => ({ ...prev, [lecture.id]: undefined }));
    setFeedbackByLecture((prev) => ({ ...prev, [lecture.id]: { type: '', text: '' } }));
  };

  const isLectureCompleted = (lectureId: string) => progress.completedLectures.includes(lectureId);

  const markLectureComplete = async (lectureId: string) => {
    if (isLectureCompleted(lectureId)) return;

    const nextProgress = {
      ...progress,
      completedLectures: [...progress.completedLectures, lectureId],
    };

    const saved = await persistProgress(nextProgress, progress);
    setFeedbackByLecture((prev) => ({
      ...prev,
      [lectureId]: saved
        ? { type: 'success', text: 'Episode completed.' }
        : { type: 'error', text: 'Could not save completion. Try again.' },
    }));
  };

  const handleQuizSubmit = async (lecture: Lecture, event: React.FormEvent) => {
    event.preventDefault();

    const questions = getQuestions(lecture);
    const questionIndex = questionIndexByLecture[lecture.id] ?? 0;
    const selectedQuestion = questions[questionIndex];

    if (!selectedQuestion) {
      setFeedbackByLecture((prev) => ({ ...prev, [lecture.id]: { type: 'error', text: 'No question found for this task.' } }));
      return;
    }

    const selectedOptionIndex = selectedOptionByLecture[lecture.id];
    const correctOptionIndex = getCorrectOptionIndex(selectedQuestion);

    if (selectedOptionIndex === undefined || selectedOptionIndex < 0) {
      setFeedbackByLecture((prev) => ({ ...prev, [lecture.id]: { type: 'error', text: 'Select an option before submitting.' } }));
      return;
    }

    if (correctOptionIndex < 0 || correctOptionIndex >= selectedQuestion.options.length) {
      setFeedbackByLecture((prev) => ({ ...prev, [lecture.id]: { type: 'error', text: 'Question answer is not configured correctly.' } }));
      return;
    }

    const isCorrect = selectedOptionIndex === correctOptionIndex;
    const currentAttemptAnswers = quizAnswersByLecture[lecture.id] || {};
    const nextAttemptAnswers = {
      ...currentAttemptAnswers,
      [questionIndex]: { selectedOptionIndex, isCorrect },
    };

    setQuizAnswersByLecture((prev) => ({ ...prev, [lecture.id]: nextAttemptAnswers }));

    const isLastQuestion = questionIndex >= questions.length - 1;

    if (!isLastQuestion) {
      setQuestionIndexByLecture((prev) => ({ ...prev, [lecture.id]: questionIndex + 1 }));
      setSelectedOptionByLecture((prev) => ({ ...prev, [lecture.id]: undefined }));
      setFeedbackByLecture((prev) => ({ ...prev, [lecture.id]: { type: '', text: '' } }));
      return;
    }

    const nextSolvedQuestions = { ...progress.solvedQuestions };
    questions.forEach((_, index) => {
      if (nextAttemptAnswers[index]?.isCorrect) {
        nextSolvedQuestions[`${lecture.id}:${index}`] = true;
      }
    });

    const allSolvedForLecture = questions.every((_, index) => nextSolvedQuestions[`${lecture.id}:${index}`]);
    const nextCompletedLectures = allSolvedForLecture && !isLectureCompleted(lecture.id)
      ? [...progress.completedLectures, lecture.id]
      : progress.completedLectures;

    const saved = await persistProgress(
      { completedLectures: nextCompletedLectures, solvedQuestions: nextSolvedQuestions },
      progress
    );

    if (!saved) {
      setFeedbackByLecture((prev) => ({ ...prev, [lecture.id]: { type: 'error', text: 'Failed to sync with server. Try again.' } }));
      return;
    }

    setSelectedOptionByLecture((prev) => ({ ...prev, [lecture.id]: undefined }));
    setQuizStartedByLecture((prev) => ({ ...prev, [lecture.id]: false }));
    setQuizCompletedByLecture((prev) => ({ ...prev, [lecture.id]: true }));

    const score = Object.values(nextAttemptAnswers).filter((result) => result.isCorrect).length;

    setFeedbackByLecture((prev) => ({
      ...prev,
      [lecture.id]: allSolvedForLecture
        ? { type: 'success', text: `Quiz complete: ${score}/${questions.length} correct. Episode completed.` }
        : { type: 'success', text: `Quiz complete: ${score}/${questions.length} correct. Review your answers below.` },
    }));

    const celebrationToken = Date.now();
    setCelebrationByLecture((prev) => ({ ...prev, [lecture.id]: celebrationToken }));

    setTimeout(() => {
      setCelebrationByLecture((prev) => {
        if (prev[lecture.id] !== celebrationToken) return prev;
        const next = { ...prev };
        delete next[lecture.id];
        return next;
      });
    }, 1600);
  };

  const totalLectures = allLectures.length;
  const completedCount = progress.completedLectures.length;
  const progressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const activeLectureInfo = useMemo(() => allLectures.find(l => l.lecture.id === activeLectureId), [allLectures, activeLectureId]);
  const activeLecture = activeLectureInfo?.lecture;
  const activeModule = activeLectureInfo?.module;

  if (progressLoading) {
    return (
      <div className="flex bg-[#0d1117] h-[calc(100vh-64px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#9aa5bf]">
          <Loader2 className="w-8 h-8 animate-spin text-[#00a859]" />
          <p className="tracking-widest uppercase text-xs font-bold">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#0d1117] h-[calc(100vh-64px)] text-[#d2d7e3] overflow-hidden">
      
      {/* ── HEADER ── */}
      <header className="flex-shrink-0 h-16 border-b border-[#263248] bg-[#121a2a] px-4 md:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link to="/courses" className="text-[#9aa5bf] hover:text-[#f3f6ff] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="hidden md:flex items-center gap-3">
            <TerminalSquare className="w-5 h-5 text-[#9fef00]" />
            <h1 className="text-lg font-bold text-[#f3f6ff]">{course.title}</h1>
          </div>
          
          <button 
            className="md:hidden text-[#9aa5bf] hover:text-[#f3f6ff]"
            onClick={() => setShowTocMobile(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs text-[#9aa5bf] font-bold uppercase tracking-wider mb-1">Your Progress</p>
            <p className="text-sm font-black text-[#f3f6ff]">{completedCount} <span className="text-[#6e7a94]">/ {totalLectures}</span></p>
          </div>
          <div className="w-32 h-2 rounded bg-[#111a29] border border-[#2a3346] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-[#9fef00] to-[#00a859]"
            />
          </div>
        </div>
      </header>

      {/* ── SPLIT WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ── LEFT: TABLE OF CONTENTS (TOC) ── */}
        <aside className={`
          absolute inset-y-0 left-0 z-30 w-full sm:w-80 bg-[#121a2a] border-r border-[#263248] 
          flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 md:h-full
          ${showTocMobile ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 border-b border-[#263248] md:hidden">
            <h2 className="text-sm font-bold text-[#f3f6ff] uppercase tracking-widest">Curriculum</h2>
            <button onClick={() => setShowTocMobile(false)} className="text-[#9aa5bf]">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {course.modules.map((module, mIdx) => (
              <div key={module.id} className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6e7a94] mb-3 px-2">
                  Module {mIdx + 1}: {module.title}
                </h3>
                <div className="space-y-1">
                  {module.lectures.map((lecture) => {
                    const isCompleted = isLectureCompleted(lecture.id);
                    const isActive = lecture.id === activeLectureId;
                    
                    return (
                      <button
                        key={lecture.id}
                        onClick={() => openLecture(lecture)}
                        className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${
                          isActive 
                            ? 'bg-[#1a2332] border-[#9fef00]/50 shadow-[0_0_15px_rgba(159,239,0,0.05)]' 
                            : 'border-transparent hover:bg-[#182235]'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-[#9fef00]" />
                          ) : lecture.quiz ? (
                            <LockKeyhole className={`w-4 h-4 ${isActive ? 'text-[#f3a43a]' : 'text-[#6e7a94]'}`} />
                          ) : (
                            <Circle className={`w-4 h-4 ${isActive ? 'text-[#60a5fa]' : 'text-[#6e7a94]'}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate font-medium ${isActive ? 'text-[#f3f6ff]' : 'text-[#d2d7e3]'}`}>
                            {lecture.title}
                          </p>
                          <p className={`text-xs mt-0.5 ${isActive ? 'text-[#9aa5bf]' : 'text-[#6e7a94]'}`}>
                            {lecture.duration}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── CENTER: VIDEO & NOTES ── */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d1117] p-4 md:p-8 xl:p-12 relative flex flex-col xl:flex-row gap-8">
          
          <div className="flex-1 max-w-4xl mx-auto xl:mx-0 w-full space-y-6">
            {activeLecture && activeModule ? (
              <motion.div
                key={activeLecture.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Video Header */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#00a859] mb-2">
                    {activeModule.title}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black text-[#f3f6ff] mb-2 flex items-center gap-3">
                    {activeLecture.title}
                  </h2>
                  <p className="text-sm text-[#9aa5bf]">{activeLecture.subtitle}</p>
                </div>

                {/* Video Player */}
                <div className="rounded-xl overflow-hidden border border-[#263248] bg-[#0e1522] shadow-2xl">
                  <div className="aspect-video w-full">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${activeLecture.videoId}`}
                      title={activeLecture.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>

                {/* Notes & Resources */}
                <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
                  {activeLecture.notes && activeLecture.notes.length > 0 && (
                    <div className="rounded-xl border border-[#263248] bg-[#121a2a] p-6">
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#263248]">
                        <BookOpen className="w-5 h-5 text-[#60a5fa]" />
                        <h3 className="text-sm font-black uppercase tracking-[0.15em] text-[#f3f6ff]">Briefing Notes</h3>
                      </div>
                      <ul className="space-y-3">
                        {activeLecture.notes.map((note, index) => (
                          <li key={index} className="text-sm text-[#d2d7e3] flex items-start gap-3">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#60a5fa] flex-shrink-0 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                            <span className="leading-relaxed">{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeLecture.resource && (
                    <a
                      href={activeLecture.resource}
                      className="inline-flex flex-col items-center justify-center p-6 w-full md:w-48 rounded-xl border border-[#263248] bg-[#121a2a] hover:bg-[#182235] hover:border-[#60a5fa]/50 transition-all group"
                      download
                    >
                      <div className="w-12 h-12 rounded-full bg-[#182235] group-hover:bg-[#60a5fa]/10 flex items-center justify-center mb-3 transition-colors">
                        <Download className="w-5 h-5 text-[#9aa5bf] group-hover:text-[#60a5fa]" />
                      </div>
                      <span className="text-sm font-bold text-[#f3f6ff]">Download Assets</span>
                      <span className="text-xs text-[#6e7a94] mt-1 text-center">Required for tasks</span>
                    </a>
                  )}
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* ── RIGHT: TASK TERMINAL QUIZ ── */}
          <div className="w-full xl:w-[400px] flex-shrink-0">
            <div className="xl:sticky top-0">
              {activeLecture ? (
                <div className="rounded-xl border border-[#f3a43a]/30 bg-[#121a2a] overflow-hidden shadow-2xl shadow-[#f3a43a]/5">
                  <div className="bg-[#1a2332] px-5 py-4 border-b border-[#f3a43a]/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TerminalSquare className="w-4 h-4 text-[#f3a43a]" />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#f8d8a6]">Lesson Quiz</h3>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    {activeLecture.quiz ? (() => {
                      const questions = getQuestions(activeLecture);
                      const questionIndex = questionIndexByLecture[activeLecture.id] ?? 0;
                      const isQuizStarted = !!quizStartedByLecture[activeLecture.id];
                      const isQuizCompleted = !!quizCompletedByLecture[activeLecture.id];
                      const attemptAnswers = quizAnswersByLecture[activeLecture.id] || {};
                      const currentQuestion = questions[questionIndex];
                      const selectedOptionIndex = selectedOptionByLecture[activeLecture.id];
                      const feedback = feedbackByLecture[activeLecture.id] || { type: '', text: '' };
                      const solvedCount = questions.filter((_, index) => progress.solvedQuestions[`${activeLecture.id}:${index}`]).length;

                      return (
                        <>
                          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#263248]">
                            <p className="text-sm font-medium text-[#d2d7e3]">Quiz Progress</p>
                            <span className="text-xs px-2 py-1 rounded border border-[#f3a43a]/40 bg-[#2b2318] text-[#f8d8a6] font-mono">
                              {solvedCount}/{questions.length} SOLVED
                            </span>
                          </div>

                          {!isQuizStarted && !isQuizCompleted && (
                            <div className="space-y-4">
                              <p className="text-sm text-[#9aa5bf] leading-relaxed">
                                Ready when you are. This lesson has {questions.length} question{questions.length === 1 ? '' : 's'}.
                              </p>
                              <Button type="button" variant="primary" onClick={() => startQuizAttempt(activeLecture)} className="w-full">
                                Start Quiz
                              </Button>
                            </div>
                          )}

                          {isQuizStarted && currentQuestion && (
                            <form onSubmit={(event) => handleQuizSubmit(activeLecture, event)} className="space-y-6">
                              <div className="space-y-2 text-sm text-[#f3f6ff] leading-relaxed">
                                <span className="text-[#9aa5bf] block text-xs uppercase mb-2">
                                  Question {questionIndex + 1} of {questions.length}
                                </span>
                                {currentQuestion.question}
                              </div>

                              <div className="space-y-2.5">
                                {currentQuestion.options.map((option, optionIndex) => {
                                  const optionLabel = letters[optionIndex] || String(optionIndex + 1);
                                  const isSelected = selectedOptionIndex === optionIndex;

                                  return (
                                    <button
                                      key={`${activeLecture.id}-${questionIndex}-option-${optionIndex}`}
                                      type="button"
                                      onClick={() => setSelectedOptionByLecture((prev) => ({ ...prev, [activeLecture.id]: optionIndex }))}
                                      className={`w-full text-left rounded-lg border px-4 py-3 transition-colors flex items-start gap-3 ${
                                        isSelected
                                          ? 'border-[#9fef00] bg-[#152015] text-[#d8ff98]'
                                          : 'border-[#263248] bg-[#0d1422] text-[#dce5f9] hover:border-[#60a5fa]/50'
                                      }`}
                                    >
                                      <span className={`text-xs px-2 py-0.5 rounded border mt-0.5 ${
                                        isSelected ? 'border-[#9fef00]/50' : 'border-[#263248]'
                                      }`}>{optionLabel}</span>
                                      <span className="text-sm font-medium">{option}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              <Button type="submit" variant="primary" className="w-full">
                                {questionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                              </Button>

                              {celebrationByLecture[activeLecture.id] && (
                                <div className="p-3 rounded bg-[#00a859]/10 border border-[#00a859]/30 text-[#00a859] text-sm animate-pulse">
                                  Great job. Answer saved.
                                </div>
                              )}
                            </form>
                          )}

                          {isQuizCompleted && (
                            <div className="space-y-5">
                              <div className="p-4 rounded-lg bg-[#0e1522] border border-[#263248] text-sm leading-relaxed">
                                <p className="text-[#9fef00] font-semibold">Quiz complete.</p>
                                <p className="mt-1 text-[#d2d7e3]">
                                  Score:{' '}
                                  <span className="font-bold text-[#f3f6ff]">
                                    {Object.values(attemptAnswers).filter((answer) => answer.isCorrect).length}/{questions.length}
                                  </span>{' '}
                                  correct
                                </p>
                              </div>

                              <div className="space-y-3">
                                {questions.map((question, index) => {
                                  const result = attemptAnswers[index];
                                  const correctOptionIndex = getCorrectOptionIndex(question);
                                  const isCorrect = result?.isCorrect;
                                  
                                  return (
                                    <div key={index} className={`p-4 rounded-lg border ${
                                      isCorrect ? 'border-[#9fef00]/30 bg-[#152015]' : 'border-[#fda4af]/30 bg-[#2b161a]'
                                    }`}>
                                      <p className="text-xs text-[#9aa5bf] mb-2 line-clamp-1">{question.question}</p>
                                      <div className="flex items-center gap-2">
                                        {isCorrect ? (
                                          <CheckCircle2 className="w-4 h-4 text-[#9fef00]" />
                                        ) : (
                                          <X className="w-4 h-4 text-[#fda4af]" />
                                        )}
                                        <p className={`text-sm font-medium ${isCorrect ? 'text-[#d8ff98]' : 'text-[#fda4af]'}`}>
                                          {isCorrect ? 'Correct' : 'Incorrect'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <Button type="button" variant="secondary" onClick={() => startQuizAttempt(activeLecture)} className="w-full mt-4">
                                Try Again
                              </Button>
                            </div>
                          )}

                          {feedback.text && (
                            <p className={`mt-4 text-xs font-mono p-3 rounded ${
                              feedback.type === 'success' ? 'bg-[#152015] text-[#9fef00] border border-[#9fef00]/30' : 'bg-[#2b161a] text-[#fda4af] border border-[#fda4af]/30'
                            }`}>
                              {feedback.text}
                            </p>
                          )}
                        </>
                      );
                    })() : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-[#263248] mx-auto mb-4" />
                        <h4 className="text-[#f3f6ff] font-bold mb-2">No Quiz for This Lesson</h4>
                        <p className="text-sm text-[#9aa5bf] mb-6">Review the lesson materials on the left.</p>
                        
                        <Button
                          variant={isLectureCompleted(activeLecture.id) ? 'secondary' : 'primary'}
                          onClick={() => markLectureComplete(activeLecture.id)}
                          disabled={isLectureCompleted(activeLecture.id) || savingProgress}
                          className="w-full"
                        >
                          {isLectureCompleted(activeLecture.id) ? 'Completed' : 'Mark as Done'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>

    </div>
  );
};

export default LinuxCoursePage;
