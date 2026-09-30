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
    { skill: 'Data Structures & Algorithms', level: 'Proficient', progress: 85, color: 'bg-[#800020]' },
    { skill: 'Deep Learning & PyTorch', level: 'Intermediate', progress: 70, color: 'bg-[#D45060]' },
    { skill: 'PostgreSQL & Database Design', level: 'Proficient', progress: 80, color: 'bg-[#800020]' },
    { skill: 'Next.js & TypeScript', level: 'Advanced', progress: 90, color: 'bg-[#5C0017]' },
    { skill: 'System Design Fundamentals', level: 'Foundational', progress: 50, color: 'bg-[#C46A76]' },
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
        <Card className="border border-[#EDE1D3] bg-gradient-to-r from-white via-[#FAF5EE] to-[#FBECEF] p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="burgundy" dot>
                  Summer 2027 Pipeline
                </Badge>
                <span className="text-xs text-[#786568]">Internship Cycle Active</span>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-[#2A1B1E]">
                Technical Interview & Internship Preparation
              </h2>
              <p className="text-sm text-[#786568] max-w-xl">
                Track your engineering skill tree, simulate AI mock interviews, and tailor coursework projects to match top tech recruiter expectations.
              </p>
            </div>

            <div className="flex items-center gap-6 bg-white border border-[#EDE1D3] p-4 rounded-2xl shrink-0 shadow-2xs">
              <div>
                <p className="text-xs text-[#786568]">Interview Readiness</p>
                <p className="text-2xl font-bold text-[#800020]">84%</p>
              </div>
              <div className="h-8 w-px bg-[#EDE1D3]" />
              <div>
                <p className="text-xs text-[#786568]">Verified Skills</p>
                <p className="text-2xl font-bold text-[#2A1B1E]">
                  14 <span className="text-xs font-normal text-[#9E8B8E]">competencies</span>
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
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
                    <Target className="h-4.5 w-4.5" />
                  </div>
                  <CardTitle>Target Internship Profiles</CardTitle>
                </div>
              </CardHeader>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {targetRoles.map((role, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#EDE1D3] bg-[#FAF5EE]/30 p-4 space-y-2 hover:border-[#D45060]/40 hover:bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-semibold text-[#800020]">
                        {role.status}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#D45060]">
                        {role.match} Match
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-[#2A1B1E]">{role.title}</h4>
                  </div>
                ))}
              </div>
            </Card>

            {/* Technical Skills Benchmark */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
                    <Terminal className="h-4.5 w-4.5" />
                  </div>
                  <CardTitle>Technical Skills Matrix</CardTitle>
                </div>
              </CardHeader>

              <div className="space-y-4">
                {skillMatrix.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#2A1B1E]">{item.skill}</span>
                      <span className="text-[#786568] font-mono">{item.level} ({item.progress}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#F3E6D5] overflow-hidden">
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
            <Card className="border border-[#EDE1D3] bg-white p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBECEF] text-[#800020] border border-[#F8CCD2]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#2A1B1E]">AI Career Coach</h4>
                  <p className="text-[11px] text-[#786568]">Autonomous Interview & Resume Guidance</p>
                </div>
              </div>

              <p className="text-xs text-[#786568] leading-relaxed">
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
                  <Sparkles className="h-3.5 w-3.5 text-[#800020]" />
                  Review Coursework Projects
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAskCareerAgent('prep_plan')}
                  className="w-full text-xs gap-2"
                >
                  <Target className="h-3.5 w-3.5 text-[#800020]" />
                  30-Day Technical Prep Plan
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-[#D45060]" />
                Upcoming Hackathons & Contests
              </CardTitle>
              <CardDescription className="text-xs mt-1">Recommended for sophomore students</CardDescription>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#FAF5EE] border border-[#EDE1D3]">
                  <div>
                    <p className="font-semibold text-[#2A1B1E]">MIT HackAI 2027</p>
                    <p className="text-[10px] text-[#9E8B8E]">Oct 12 - 14 • Virtual</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-[#9E8B8E]" />
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#FAF5EE] border border-[#EDE1D3]">
                  <div>
                    <p className="font-semibold text-[#2A1B1E]">ACM ICPC Regional Qualifier</p>
                    <p className="text-[10px] text-[#9E8B8E]">Nov 04 • On Campus</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-[#9E8B8E]" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
