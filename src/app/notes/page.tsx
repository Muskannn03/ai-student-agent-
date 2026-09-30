'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  BookOpen,
  Search,
  Sparkles,
  Upload,
  FileText,
  Trash2,
  Bot,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';

interface NoteItem {
  id: string;
  title: string;
  courseName?: string;
  fileName?: string;
  fileSize?: number;
  pageCount?: number;
  chunkCount?: number;
  tags?: string[];
  date?: string;
  isUploadedPdf?: boolean;
}

export default function NotesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docSubject, setDocSubject] = useState('Algorithms & Proofs (CS301)');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notes${search ? `?q=${encodeURIComponent(search)}` : ''}`);
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setNotes(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setUploadError('Only PDF files are supported for notes processing.');
        return;
      }
      setSelectedFile(file);
      setDocTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadStep('Extracting text & parsing PDF structure...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (docTitle.trim()) formData.append('title', docTitle.trim());
      if (docSubject.trim()) formData.append('subject', docSubject.trim());

      setUploadStep('Generating semantic chunks & vector embeddings...');
      const res = await fetch('/api/notes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.success === false || data.error) {
        throw new Error(data.error || data.details || 'Failed to process PDF note.');
      }

      setUploadStep('Storing chunks & embeddings in PostgreSQL...');
      setUploadSuccess(
        `Document indexed successfully: "${data.document.title}" (${data.document.chunkCount} vector chunks)`
      );
      setSelectedFile(null);
      setDocTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh notes list
      await fetchNotes();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Error processing PDF document');
    } finally {
      setIsUploading(false);
      setUploadStep(null);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const handleChatWithNote = (note: NoteItem) => {
    const prompt = `According to my uploaded notes on "${note.title}", what are the key concepts, formulas, and critical exam takeaways?`;
    router.push(`/chat?prompt=${encodeURIComponent(prompt)}`);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppShell
      title="RAG Notes Assistant"
      subtitle="Upload PDF lecture notes, textbooks, and course slides to enable semantic vector retrieval and AI citation"
    >
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Top: PDF Upload Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="h-4 w-4" />
                <span>RAG Knowledge Base Ingestion</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Upload Course Notes & PDF Documents
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1 leading-relaxed">
                PDFs are automatically sanitized, split into semantic overlapping chunks, embedded into vector representations, and indexed in PostgreSQL for instantaneous semantic retrieval.
              </p>
            </div>

            {/* Upload Status / Quick Stats */}
            <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800/80 px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Storage Engine</p>
                  <p className="text-xs font-bold text-slate-200">PostgreSQL Vector</p>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Indexed Documents</p>
                  <p className="text-xs font-bold text-slate-200">{notes.length} Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleUploadSubmit} className="mt-6 pt-6 border-t border-slate-800/80 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* File Selector */}
              <div className="flex flex-col justify-center border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 rounded-2xl p-4 text-center cursor-pointer transition-all">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload-input"
                  disabled={isUploading}
                />
                <label htmlFor="pdf-upload-input" className="cursor-pointer space-y-2">
                  <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    {selectedFile ? <FileCheck className="h-5 w-5 text-emerald-400" /> : <Upload className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {selectedFile ? selectedFile.name : 'Select or drop PDF notes'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {selectedFile ? formatFileSize(selectedFile.size) : 'PDF format up to 15MB'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Document Title</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Graph Algorithms & Dijkstra Proofs"
                  disabled={isUploading}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Subject Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Course / Subject</label>
                <select
                  value={docSubject}
                  onChange={(e) => setDocSubject(e.target.value)}
                  disabled={isUploading}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Algorithms & Proofs (CS301)">Algorithms & Proofs (CS301)</option>
                  <option value="Deep Learning Architecture (AI402)">Deep Learning Architecture (AI402)</option>
                  <option value="Database Systems (DS205)">Database Systems (DS205)</option>
                  <option value="Operating Systems & Concurrency">Operating Systems & Concurrency</option>
                  <option value="General Academic Notes">General Academic Notes</option>
                </select>
              </div>
            </div>

            {/* Feedback Banners */}
            {uploadStep && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 text-xs">
                <LoadingSpinner size="sm" />
                <span>{uploadStep}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!selectedFile || isUploading}
                isLoading={isUploading}
                className="gap-2 px-6"
              >
                <Upload className="h-4 w-4" />
                <span>Process & Store PDF</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search indexed notes by topic or course..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="purple" className="text-xs font-mono">
              {notes.length} Documents Ready for RAG
            </Badge>
          </div>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="md" label="Loading notes knowledge base..." />
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Documents Uploaded Yet"
            description="Upload your first lecture note or syllabus PDF above to empower your AI Student Assistant with semantic grounded recall."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="group relative flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300"
              >
                <div>
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      <Badge variant="purple" className="text-[10px]">
                        {note.courseName || 'Coursework'}
                      </Badge>
                    </div>

                    <CardTitle className="text-sm font-bold text-white mt-3 line-clamp-2">
                      {note.title}
                    </CardTitle>
                  </CardHeader>

                  <div className="px-5 pb-4 space-y-3">
                    {/* Meta stats */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>{note.pageCount || 1} Pages</span>
                      <span>•</span>
                      <span>{note.chunkCount || 4} Chunks</span>
                      <span>•</span>
                      <span>{formatFileSize(note.fileSize)}</span>
                    </div>

                    {/* Tag badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {note.tags?.map((t, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between p-4 bg-slate-950/60 border-t border-slate-800/80 rounded-b-2xl">
                  <button
                    onClick={() => handleDeleteDocument(note.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleChatWithNote(note)}
                    className="gap-1.5 text-xs py-1.5 px-3"
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span>Ask AI About Note</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
