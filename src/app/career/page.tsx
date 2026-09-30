'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Briefcase,
  Sparkles,
  Award,
  Terminal,
  ExternalLink,
  Target,
} from 'lucide-react';

export default function CareerPage() {
  const targetRoles = [
    { title: 'AI/ML Engineering Intern', match: '92%', status: 'Primary Goal' },
    { title: 'Full-Stack Software Engineer', match: '88%', status: 'Target' },
    { title: 'Data Systems Engineer', match: '80%', status: 'Exploring' },
  ];

  const skillMatrix = [
    { skill: 'Data Structures & Algorithms', level: 'Proficient', progress: 85, color: 'bg-indigo-500' },
    { skill: 'Deep Learning & PyTorch', level: 'Intermediate', progress: 70, color: 'bg-pink-500' },
    { skill: 'PostgreSQL & Database Design', level: 'Proficient', progress: 80, color: 'bg-teal-500' },
    { skill: 'Next.js & TypeScript', level: 'Advanced', progress: 90, color: 'bg-amber-500' },
    { skill: 'System Design Fundamentals', level: 'Foundational', progress: 50, color: 'bg-violet-500' },
  ];

  const handleAskCareerAgent = (action: string) => {
    let prompt = '';
    if (action === 'mock_interview') {
      prompt = 'Conduct a 5-question technical mock interview for an AI/ML Software Engineering internship. Ask one question at a time and evaluate my response.';
    } else if (action === 'resume_review') {
      prompt = 'Help me optimize my technical resume for college student software engineering internships. What key project bullet points should I highlight for algorithms and deep learning coursework?';
    } else {
      prompt = 'Provide a 30-day technical interview prep schedule for LeetCode medium algorithms and system design basics.';
    }
    window.location.href = `/chat?prompt=${encodeURIComponent(prompt)}`;
  };

  return (
    <AppShell
      title="Career & Internship Roadmap"
      subtitle="Industry readiness, skill benchmarks, technical interview prep, and AI career guidance"
    >
      <div className="space-y-6">
        {/* Readiness Overview Banner */}
        <Card glow className="border-indigo-500/30 bg-gradient-to-r from-slate-900 via-slate-900/80 to-indigo-950/40 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="success" dot>
                  Summer 2027 Pipeline
                </Badge>
                <span className="text-xs text-slate-400">Internship Cycle Active</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Technical Interview & Internship Preparation
              </h2>
              <p className="text-sm text-slate-400 max-w-xl">
                Track your engineering skill tree, simulate AI mock interviews, and tailor coursework projects to match top tech recruiter expectations.
              </p>
            </div>

            <div className="flex items-center gap-6 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl shrink-0">
              <div>
                <p className="text-xs text-slate-400">Interview Readiness</p>
                <p className="text-2xl font-extrabold text-emerald-400">84%</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <p className="text-xs text-slate-400">Verified Skills</p>
                <p className="text-2xl font-bold text-white">
                  14 <span className="text-xs font-normal text-slate-500">competencies</span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Target Roles and Skill Tree */}
          <div className="lg:col-span-2 space-y-6">
            {/* Target Roles */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-400" />
                  <CardTitle>Target Internship Profiles</CardTitle>
                </div>
              </CardHeader>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {targetRoles.map((role, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-indigo-400">
                        {role.status}
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-400">
                        {role.match} Match
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{role.title}</h4>
                  </div>
                ))}
              </div>
            </Card>

            {/* Technical Skills Benchmark */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-indigo-400" />
                  <CardTitle>Technical Skills Matrix</CardTitle>
                </div>
              </CardHeader>

              <div className="space-y-4">
                {skillMatrix.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.skill}</span>
                      <span className="text-slate-400 font-mono">{item.level} ({item.progress}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: AI Career Coach Actions */}
          <div className="space-y-6">
            <Card glow className="border-indigo-500/20 bg-slate-900/80 p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Career Coach</h4>
                  <p className="text-[11px] text-slate-400">Autonomous Interview & Resume Simulation</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Practice coding and behavioral questions tailored directly to your enrolled courses and projects.
              </p>

              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAskCareerAgent('mock_interview')}
                  className="w-full text-xs gap-2"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  Start AI Mock Interview
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAskCareerAgent('resume_review')}
                  className="w-full text-xs gap-2"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Review Coursework Projects
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAskCareerAgent('prep_plan')}
                  className="w-full text-xs gap-2"
                >
                  <Target className="h-3.5 w-3.5" />
                  30-Day LeetCode Study Roadmap
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                Upcoming Hackathons & Contests
              </CardTitle>
              <CardDescription className="text-xs mt-1">Recommended for sophomore students</CardDescription>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <p className="font-semibold text-white">MIT HackAI 2027</p>
                    <p className="text-[10px] text-slate-400">Oct 12 - 14 • Virtual</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <p className="font-semibold text-white">ACM ICPC Regional Qualifier</p>
                    <p className="text-[10px] text-slate-400">Nov 04 • On Campus</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
