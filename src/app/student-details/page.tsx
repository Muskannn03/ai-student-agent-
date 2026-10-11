'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Plus,
  X,
  ArrowRight,
  School,
  Briefcase,
  Layers,
  Clock,
  CheckSquare,
  LayoutDashboard,
  BrainCircuit,
  AlertCircle,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const CLASS_LEVEL_OPTIONS = [
  '1st Year (Freshman)',
  '2nd Year (Sophomore)',
  '3rd Year (Junior)',
  '4th Year / Final Year',
  'Class 12 (Board Prep)',
  'Class 11 (Senior Secondary)',
  'Class 10 (Secondary)',
  'Master’s / Postgraduate',
];

const COURSE_PRESETS = [
  'B.Tech Computer Science & AI',
  'B.Tech Information Technology',
  'BCA / MCA',
  'B.Sc Data Science & AI',
  'Class 11-12 Science (PCM)',
  'Class 11-12 Commerce',
  'Business Administration (BBA)',
];

const SUBJECT_SUGGESTIONS: Record<string, string[]> = {
  cs: [
    'Data Structures & Algorithms',
    'Operating Systems',
    'Database Management Systems (DBMS)',
    'Computer Networks',
    'Machine Learning & AI',
    'Discrete Mathematics',
    'Web Technologies',
    'Software Engineering',
  ],
  school_science: [
    'Physics',
    'Chemistry',
    'Mathematics',
    'English Core',
    'Computer Science (Python)',
    'Biology',
  ],
  commerce: [
    'Accountancy',
    'Business Studies',
    'Economics',
    'Applied Mathematics',
    'Financial Markets',
  ],
};

const SKILL_PRESETS = [
  'Python',
  'Java',
  'C++',
  'JavaScript / TypeScript',
  'React & Next.js',
  'SQL & Databases',
  'Machine Learning',
  'Data Structures',
  'Git & GitHub',
];

const CAREER_PRESETS = [
  'Software Development Engineer (SDE)',
  'AI / Machine Learning Engineer',
  'Full Stack Web Developer',
  'Data Scientist & Analyst',
  'Cybersecurity Analyst',
  'Higher Studies / GATE / GRE',
];

export default function StudentDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('B.Tech Computer Science & AI');
  const [classLevel, setClassLevel] = useState('2nd Year (Sophomore)');
  const [semester, setSemester] = useState<number>(3);
  const [subjects, setSubjects] = useState<string[]>([
    'Data Structures & Algorithms',
    'Operating Systems',
    'Database Management Systems (DBMS)',
    'Computer Networks',
  ]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [skills, setSkills] = useState<string[]>(['Python', 'TypeScript', 'SQL']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [careerGoals, setCareerGoals] = useState('Software Development Engineer (SDE)');
  const [dailyStudyHours, setDailyStudyHours] = useState('3');

  // Load existing profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/student-profile');
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          if (d.name) setName(d.name);
          if (d.college) setCollege(d.college);
          if (d.course) setCourse(d.course);
          if (d.semester) setSemester(d.semester);
          if (d.classLevel) setClassLevel(d.classLevel);
          if (Array.isArray(d.subjects) && d.subjects.length > 0) {
            setSubjects(d.subjects);
          }
          if (Array.isArray(d.skills) && d.skills.length > 0) {
            setSkills(d.skills);
          }
          if (d.careerGoals) setCareerGoals(d.careerGoals);
        }
      } catch (err) {
        console.warn('Could not load profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Handle adding custom subject
  const handleAddSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;
    if (!subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed]);
    }
    setNewSubjectInput('');
  };

  const handleToggleSubjectSuggestion = (sub: string) => {
    if (subjects.includes(sub)) {
      setSubjects(subjects.filter((s) => s !== sub));
    } else {
      setSubjects([...subjects, sub]);
    }
  };

  const handleRemoveSubject = (sub: string) => {
    setSubjects(subjects.filter((s) => s !== sub));
  };

  // Handle adding skills
  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setNewSkillInput('');
  };

  const handleToggleSkill = (sk: string) => {
    if (skills.includes(sk)) {
      setSkills(skills.filter((s) => s !== sk));
    } else {
      setSkills([...skills, sk]);
    }
  };

  const handleRemoveSkill = (sk: string) => {
    setSkills(skills.filter((s) => s !== sk));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (subjects.length === 0) {
      setErrorMessage('Please add at least one subject to personalize your workspace.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/student-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          college: college.trim() || undefined,
          course: course.trim(),
          classLevel,
          semester: Number(semester),
          subjects,
          skills,
          careerGoals: careerGoals.trim() || undefined,
          dailyStudyHours: Number(dailyStudyHours) || 3,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save student profile.');
      }

      setSuccessMessage('Student details saved! Adapting your AI Tutor, Timetable, and Dashboard...');

      // Redirect smoothly to dashboard
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current active suggestions based on course text
  const currentSubjectSuggestions = course.toLowerCase().includes('commerce')
    ? SUBJECT_SUGGESTIONS.commerce
    : course.toLowerCase().includes('science') && (classLevel.includes('11') || classLevel.includes('12'))
    ? SUBJECT_SUGGESTIONS.school_science
    : SUBJECT_SUGGESTIONS.cs;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading student profile configuration..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#2A1B1E] py-8 px-4 sm:px-6 lg:px-8 selection:bg-[#F3E6D5] selection:text-[#5C0017] relative">
      {/* Background Ambient Radial Tints */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full bg-[#F3E6D5]/60 blur-[130px]" />
        <div className="absolute top-1/3 -right-32 h-[36rem] w-[36rem] rounded-full bg-[#D45060]/10 blur-[140px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Top Header & Brand */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE1D3] pb-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBECEF] text-[#800020] border border-[#F4CDD5] shadow-xs">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-[#800020] text-xl leading-tight block">
                  AISA
                </span>
                <Badge variant="burgundy" className="text-[10px] py-0 px-2">
                  Academic Profile Setup
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2A1B1E] tracking-tight mt-0.5">
                Tell Us About Your Academic Journey
              </h1>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#786568] hover:text-[#800020] transition-colors self-start sm:self-center flex items-center gap-1"
          >
            <span>Skip to Dashboard</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Onboarding Welcome Banner */}
        {isOnboarding && (
          <div className="rounded-2xl border border-[#F8CCD2] bg-[#FBECEF]/80 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#800020] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[#800020]">
                Welcome aboard! Your workspace is ready to be personalized.
              </h2>
              <p className="text-xs text-[#5C0017] leading-relaxed">
                By telling us about your <strong>class, degree, and enrolled subjects</strong>, AISA will customize your AI Tutor, auto-generate your weekly timetable, organize your assignments, and categorize your lecture notes.
              </p>
            </div>
          </div>
        )}

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#F8CCD2] bg-[#FDF2F3] p-4 text-xs text-[#800020]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#EDE1D3] bg-[#FAF5EE] p-4 text-xs text-[#800020]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#800020]" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Student Identity & Course Details */}
          <div className="rounded-3xl border border-[#EDE1D3] bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#EDE1D3] pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF5EE] text-[#800020] border border-[#EDE1D3]">
                <School className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#2A1B1E]">1. Academic Identity & Degree</h3>
                <p className="text-[11px] text-[#786568]">Your name, college, class year, and course of study</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2A1B1E]">
                  Full Name <span className="text-[#800020]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muskan Verma"
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 px-3.5 text-xs sm:text-sm text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
                />
              </div>

              {/* College / Institution */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2A1B1E]">
                  College / School / University
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. School of Engineering & Technology"
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 px-3.5 text-xs sm:text-sm text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
                />
              </div>

              {/* Course / Degree */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#2A1B1E]">
                  Degree / Program / Stream <span className="text-[#800020]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science & AI"
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 px-3.5 text-xs sm:text-sm text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
                />

                {/* Course presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-[#9E8B8E] self-center mr-1">Quick presets:</span>
                  {COURSE_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCourse(p)}
                      className={`text-[11px] rounded-lg px-2.5 py-1 transition-all cursor-pointer border ${
                        course === p
                          ? 'bg-[#800020] text-white border-[#800020]'
                          : 'bg-[#FAF5EE] text-[#5C4549] border-[#EDE1D3] hover:border-[#800020]/40'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class / Year Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2A1B1E]">
                  Class / Academic Year <span className="text-[#800020]">*</span>
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 px-3.5 text-xs sm:text-sm text-[#2A1B1E] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs cursor-pointer"
                >
                  {CLASS_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2A1B1E]">Current Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 px-3.5 text-xs sm:text-sm text-[#2A1B1E] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Enrolled Subjects (Core Feature) */}
          <div className="rounded-3xl border border-[#EDE1D3] bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#EDE1D3] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F4CDD5]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#2A1B1E]">2. Enrolled Subjects & Coursework</h3>
                  <p className="text-[11px] text-[#786568]">
                    Add all subjects you are currently studying. Services will be organized around these.
                  </p>
                </div>
              </div>

              <Badge variant="burgundy" className="text-xs font-mono">
                {subjects.length} Subjects Active
              </Badge>
            </div>

            {/* Currently Selected Subject Badges */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#2A1B1E] block">
                Your Active Enrolled Subjects ({subjects.length}):
              </label>

              {subjects.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-[#EDE1D3] text-center text-xs text-[#9E8B8E] bg-[#FAF5EE]/40">
                  No subjects added yet. Pick from the suggestions below or type a custom subject name.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 p-3.5 rounded-2xl bg-[#FAF5EE]/60 border border-[#EDE1D3]">
                  {subjects.map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#800020] border border-[#F8CCD2] shadow-2xs group hover:border-[#800020] transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-[#800020]" />
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub)}
                        className="text-[#9E8B8E] hover:text-[#D45060] p-0.5 rounded-md hover:bg-[#FBECEF] transition-colors ml-0.5 cursor-pointer"
                        title="Remove subject"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add Custom Subject Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubject();
                  }
                }}
                placeholder="Type a subject name (e.g. Microprocessors & Interfacing)..."
                className="flex-1 rounded-xl border border-[#EDE1D3] bg-white py-2.5 px-3.5 text-xs sm:text-sm text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddSubject()}
                disabled={!newSubjectInput.trim()}
                className="gap-1.5 text-xs px-4"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </Button>
            </div>

            {/* Suggested Subject Pills */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-semibold text-[#786568] uppercase tracking-wider">
                Click to add popular suggestions for {course}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentSubjectSuggestions.map((sub) => {
                  const isSelected = subjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleToggleSubjectSuggestion(sub)}
                      className={`text-[11px] rounded-lg px-2.5 py-1.5 transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#FBECEF] text-[#800020] border-[#F4CDD5] font-semibold'
                          : 'bg-white text-[#5C4549] border-[#EDE1D3] hover:border-[#800020]/40 hover:bg-[#FAF5EE]'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="h-3 w-3 text-[#800020]" />
                      ) : (
                        <Plus className="h-3 w-3 text-[#9E8B8E]" />
                      )}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Skills & Career Aspirations */}
          <div className="rounded-3xl border border-[#EDE1D3] bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#EDE1D3] pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF5EE] text-[#800020] border border-[#EDE1D3]">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#2A1B1E]">3. Skills & Career Focus</h3>
                <p className="text-[11px] text-[#786568]">Your target role and technical or academic strengths</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Career Goal */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2A1B1E]">
                  Target Career / Dream Job Role
                </label>
                <input
                  type="text"
                  value={careerGoals}
                  onChange={(e) => setCareerGoals(e.target.value)}
                  placeholder="e.g. AI / Machine Learning Engineer"
                  className="w-full rounded-xl border border-[#EDE1D3] bg-white py-2.5 px-3.5 text-xs sm:text-sm text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]/25 transition-all shadow-2xs"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-[#9E8B8E] self-center mr-1">Role suggestions:</span>
                  {CAREER_PRESETS.map((cr) => (
                    <button
                      key={cr}
                      type="button"
                      onClick={() => setCareerGoals(cr)}
                      className={`text-[11px] rounded-lg px-2.5 py-1 transition-all cursor-pointer border ${
                        careerGoals === cr
                          ? 'bg-[#800020] text-white border-[#800020]'
                          : 'bg-[#FAF5EE] text-[#5C4549] border-[#EDE1D3] hover:border-[#800020]/40'
                      }`}
                    >
                      {cr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#2A1B1E]">
                  Skills & Focus Areas ({skills.length}):
                </label>

                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-[#FAF5EE]/60 border border-[#EDE1D3]">
                  {skills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#2A1B1E] border border-[#EDE1D3]"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        className="text-[#9E8B8E] hover:text-[#D45060]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add custom skill (e.g. PyTorch, React, Docker)..."
                    className="flex-1 rounded-xl border border-[#EDE1D3] bg-white py-2 px-3 text-xs text-[#2A1B1E] placeholder:text-[#9A878A] focus:border-[#800020] focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddSkill()}
                    disabled={!newSkillInput.trim()}
                    className="text-xs py-2 px-3"
                  >
                    Add Skill
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SKILL_PRESETS.map((sk) => {
                    const isSelected = skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => handleToggleSkill(sk)}
                        className={`text-[10px] rounded-md px-2 py-0.5 border transition-all ${
                          isSelected
                            ? 'bg-[#FBECEF] text-[#800020] border-[#F8CCD2] font-semibold'
                            : 'bg-white text-[#786568] border-[#EDE1D3] hover:border-[#800020]/40'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sk}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Study Goal */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-[#2A1B1E] flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-[#D45060]" />
                  <span>Daily Study Target (Hours per day)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['2', '3', '4', '5'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDailyStudyHours(h)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                        dailyStudyHours === h
                          ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                          : 'bg-[#FAF5EE] text-[#2A1B1E] border-[#EDE1D3] hover:border-[#800020]/40'
                      }`}
                    >
                      {h} Hours / Day
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: How Other Services Will Adapt (Interactive Showcase) */}
          <div className="rounded-3xl border border-[#EDE1D3] bg-[#FAF5EE]/70 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#800020]">
              <Sparkles className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Services Tailored to Your Profile
              </h3>
            </div>
            <p className="text-xs text-[#786568] leading-relaxed">
              Once saved, every section in AISA immediately tunes itself to your registered course and subjects:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              <div className="rounded-2xl bg-white border border-[#EDE1D3] p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#800020]">
                  <BrainCircuit className="h-4 w-4" />
                  <span className="text-xs font-bold">AI Tutor Agent</span>
                </div>
                <p className="text-[11px] text-[#786568] leading-relaxed">
                  Grounded in your <strong>{subjects.length} subjects</strong>. Prompts and study plans will cite your exact syllabus.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-[#EDE1D3] p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#800020]">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="text-xs font-bold">Smart Dashboard</span>
                </div>
                <p className="text-[11px] text-[#786568] leading-relaxed">
                  Live subject-wise progress meters and sprint tasks configured for <strong>{course}</strong>.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-[#EDE1D3] p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#800020]">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-bold">Automated Timetable</span>
                </div>
                <p className="text-[11px] text-[#786568] leading-relaxed">
                  Auto-populates weekly lecture blocks and revision sessions for your active subjects.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-[#EDE1D3] p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#800020]">
                  <CheckSquare className="h-4 w-4" />
                  <span className="text-xs font-bold">Assignment Hub</span>
                </div>
                <p className="text-[11px] text-[#786568] leading-relaxed">
                  Assignment creation and filters automatically preloaded with your registered subjects.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-[#EDE1D3] p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#800020]">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs font-bold">Notes & RAG AI</span>
                </div>
                <p className="text-[11px] text-[#786568] leading-relaxed">
                  PDF lecture notes upload dropdown configured with your subjects for grounded exam recall.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-[#EDE1D3] p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#800020]">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-xs font-bold">Career Roadmap</span>
                </div>
                <p className="text-[11px] text-[#786568] leading-relaxed">
                  Skill progression tailored towards becoming a <strong>{careerGoals || 'Professional'}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-[#786568] hover:text-[#800020] transition-colors order-2 sm:order-1"
            >
              Skip for now and continue to Dashboard
            </Link>

            <Button
              type="submit"
              disabled={isSubmitting || subjects.length === 0}
              isLoading={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 text-xs sm:text-sm font-semibold gap-2 shadow-sm order-1 sm:order-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Save Profile & Launch Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
