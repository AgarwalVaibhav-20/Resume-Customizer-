"use client"

import * as React from "react"
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clipboard,
  FileCheck,
  FileText,
  FileUp,
  GitCompare,
  History,
  Layers,
  Lightbulb,
  LoaderCircle,
  Mail,
  RefreshCw,
  Send,
  Sliders,
  Sparkles,
  Target,
  WandSparkles,
  Zap,
} from "lucide-react"
import {
  customizeResume,
  generateCoverLetter,
  type CoverLetterResult,
  type CustomizationResult,
  type ResumeSection,
} from "@/lib/api"
import { FileUpload } from "@/components/ui/file-upload"
import { ThemeToggle } from "@/components/theme-toggle"

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALL_SECTIONS = [
  { id: "summary", label: "Professional Summary" },
  { id: "skills", label: "Skills & Keywords" },
  { id: "experience", label: "Work Experience" },
  { id: "projects", label: "Projects & Impact" },
]

const SAMPLE_JD = `Senior Full Stack Developer

We are looking for an experienced Full Stack Developer to build modern, high-performance web applications.

Responsibilities:
- Build and maintain responsive frontend interfaces with React, Next.js, and TypeScript.
- Architect robust backend APIs and microservices using Python (FastAPI/Django) and Node.js.
- Work with relational and NoSQL databases (PostgreSQL, MongoDB, Redis).
- Integrate AI services, LLM endpoints, and RAG pipelines.
- Write unit/integration tests and optimize application speed and Core Web Vitals.
- Collaborate with product designers and deploy scalable solutions on cloud infrastructure (AWS/Vercel).

Requirements:
- 3+ years of experience with React, Next.js, TypeScript, and modern CSS/Tailwind.
- Strong knowledge of RESTful APIs, asynchronous programming, and SQL.
- Familiarity with Git workflows, Docker, CI/CD pipelines, and cloud deployment.
- Passion for clean code, system architecture, and AI-driven developer workflows.`

interface ResumeVersion {
  id: string
  label: string
  createdAt: string
  result: CustomizationResult
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], {
    type: "text/plain;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function sectionText(section: ResumeSection) {
  return `${section.heading}\n${section.content}`
}

function resumeToText(resume: CustomizationResult["resume"]) {
  const sections = [
    resume.full_name,
    resume.professional_title,
    ...(resume.contact_info || []),
    "",
    "PROFESSIONAL SUMMARY",
    resume.summary,
    "",
    "SKILLS",
    (resume.skills || []).join(", "),
    "",
    "EXPERIENCE",
    ...(resume.experience || []).map(sectionText),
    "",
    "EDUCATION",
    ...(resume.education || []).map(sectionText),
    "",
    "PROJECTS",
    ...(resume.projects || []).map(sectionText),
    "",
    "CERTIFICATIONS",
    ...(resume.certifications || []),
  ]

  return sections.filter((item) => item !== undefined).join("\n")
}

export default function Home() {
  const [jobDescription, setJobDescription] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [selectedSections, setSelectedSections] = React.useState<string[]>([
    "summary",
    "skills",
    "experience",
    "projects",
  ])

  // Active result and versions history
  const [result, setResult] = React.useState<CustomizationResult | null>(null)
  const [versions, setVersions] = React.useState<ResumeVersion[]>([])
  const [activeVersionId, setActiveVersionId] = React.useState<string | null>(null)

  // Active output tab
  const [activeTab, setActiveTab] = React.useState<"tailored" | "diff" | "cover-letter">("tailored")

  // Cover Letter state
  const [companyName, setCompanyName] = React.useState("")
  const [roleTitle, setRoleTitle] = React.useState("")
  const [coverLetter, setCoverLetter] = React.useState<CoverLetterResult | null>(null)
  const [coverLetterLoading, setCoverLetterLoading] = React.useState(false)
  const [coverLetterCopied, setCoverLetterCopied] = React.useState(false)

  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  function handleFileSelect(selected: File | null) {
    setError("")
    setFile(selected)
  }

  function toggleSection(sectionId: string) {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (jobDescription.trim().length < 50) {
      setError("Please provide a job description with at least 50 characters.")
      return
    }

    if (jobDescription.length > 20_000) {
      setError("The job description must be under 20,000 characters.")
      return
    }

    if (!file) {
      setError("Please upload your resume (PDF or DOCX) to continue.")
      return
    }

    if (selectedSections.length === 0) {
      setError("Please select at least one section to customize.")
      return
    }

    setLoading(true)

    try {
      const data = await customizeResume(jobDescription, file, selectedSections)
      setResult(data)

      const newVersion: ResumeVersion = {
        id: `v-${Date.now()}`,
        label: `Version ${versions.length + 1}`,
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        result: data,
      }

      setVersions((prev) => [newVersion, ...prev])
      setActiveVersionId(newVersion.id)
      setActiveTab("tailored")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while tailoring your resume. Please check your backend connection."
      )
    } finally {
      setLoading(false)
    }
  }

  function selectVersion(v: ResumeVersion) {
    setActiveVersionId(v.id)
    setResult(v.result)
  }

  async function handleGenerateCoverLetter() {
    if (!file) {
      setError("Please upload your resume to generate a cover letter.")
      return
    }
    if (jobDescription.trim().length < 50) {
      setError("Please provide a job description with at least 50 characters.")
      return
    }

    setError("")
    setCoverLetterLoading(true)

    try {
      const data = await generateCoverLetter(
        jobDescription,
        file,
        companyName,
        roleTitle
      )
      setCoverLetter(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate cover letter. Please try again."
      )
    } finally {
      setCoverLetterLoading(false)
    }
  }

  function resetForm() {
    setJobDescription("")
    setFile(null)
    setResult(null)
    setVersions([])
    setActiveVersionId(null)
    setCoverLetter(null)
    setError("")
    setCopied(false)
    setSelectedSections(["summary", "skills", "experience", "projects"])
  }

  async function copyResume() {
    if (!result?.resume) return

    try {
      await navigator.clipboard.writeText(resumeToText(result.resume))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError("Unable to copy to clipboard automatically. Please click Download.")
    }
  }

  async function copyCoverLetter() {
    if (!coverLetter?.letter_body) return

    const fullLetter = `${coverLetter.salutation}\n\n${coverLetter.letter_body}\n\nSincerely,\n${
      result?.resume.full_name || "Applicant"
    }`

    try {
      await navigator.clipboard.writeText(fullLetter)
      setCoverLetterCopied(true)
      setTimeout(() => setCoverLetterCopied(false), 2500)
    } catch {
      setError("Unable to copy cover letter. Please download instead.")
    }
  }

  const resume = result?.resume

  // Match score rating color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
    if (score >= 60) return "text-amber-500 border-amber-500/30 bg-amber-500/10"
    return "text-rose-500 border-rose-500/30 bg-rose-500/10"
  }

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight">
                  Resume<span className="text-indigo-500">Craft</span>
                </span>
                <span className="hidden rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 sm:inline-block">
                  AI ATS Studio
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FastAPI & Gemini Connected</span>
            </div>

            <ThemeToggle />

            <button
              type="button"
              onClick={resetForm}
              title="Reset all fields"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-500 dark:text-indigo-400">
            <WandSparkles className="h-3.5 w-3.5" />
            <span>AI ATS Resume Optimizer & Cover Letter Studio</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Your experience.{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
              Tailored for the role.
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Align your resume with any job description, inspect visual before/after diffs,
            generate tailored cover letters, and maximize your ATS score.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Section-wise Customization
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Side-by-Side Diff View
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Cover Letter Generator
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Multiple Version History
            </span>
          </div>
        </div>

        {/* Two-Column App Layout */}
        <form
          onSubmit={handleSubmit}
          className="grid items-start gap-8 lg:grid-cols-12"
        >
          {/* Left Column: Form Controls (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Step 1: Target Job Description */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Target Job Description
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Paste the requirements for the job you want
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setJobDescription(SAMPLE_JD)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-400 hover:underline"
                >
                  <Zap className="h-3 w-3" />
                  <span>Sample JD</span>
                </button>
              </div>

              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description or requirements here..."
                rows={9}
                maxLength={20_000}
                className="w-full resize-y rounded-xl border border-border/80 bg-muted/20 px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-indigo-500 focus:bg-background focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
              />

              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Minimum 50 characters</span>
                <span className={jobDescription.length > 20_000 ? "text-destructive" : ""}>
                  {jobDescription.length.toLocaleString()} / 20,000
                </span>
              </div>
            </div>

            {/* Step 2: Resume Upload */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 dark:text-violet-400">
                  <FileUp className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Your Current Resume
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Upload your existing resume to tailor
                  </p>
                </div>
              </div>

              <FileUpload
                file={file}
                onFileSelect={handleFileSelect}
                maxSizeMB={5}
                disabled={loading}
              />
            </div>

            {/* Step 3: Section-wise Customization Scope */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-500" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Sections to Customize
                  </h2>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {selectedSections.length} of {ALL_SECTIONS.length} active
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Choose which parts of your resume should be optimized by AI:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_SECTIONS.map((sec) => {
                  const isChecked = selectedSections.includes(sec.id)
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => toggleSection(sec.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition ${
                        isChecked
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-md border transition-colors ${
                          isChecked
                            ? "border-indigo-500 bg-indigo-500 text-white"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{sec.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-500 dark:text-rose-400 animate-in fade-in"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 py-3.5 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>Customizing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>Customize My Resume</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-muted-foreground">
              Supports standard ATS formats. Always review changes before applying.
            </p>
          </div>

          {/* Right Column: Output / Workspace (7 cols) */}
          <div className="min-w-0 lg:col-span-7">
            {/* Version Switcher Bar */}
            {versions.length > 1 && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-xs">
                <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-muted-foreground">
                  <History className="h-4 w-4 text-indigo-500" />
                  <span>Versions:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {versions.map((v) => {
                    const isActive = activeVersionId === v.id
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => selectVersion(v)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "border border-border/70 bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        <span>{v.label}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {v.result.match_score}%
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* State 1: Idle / Empty State */}
            {!result && !loading && (
              <div className="flex min-h-[480px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 p-8 text-center backdrop-blur-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 shadow-xs">
                  <FileText className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  Tailored resume preview
                </h3>
                <p className="mt-2 max-w-sm text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  Paste the job description and attach your resume on the left.
                  Your customized resume, match score, diff comparison, and cover letter generator will display here.
                </p>

                <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 text-center">
                    <p className="text-xs font-bold text-indigo-500">01. Target</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Requirements</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 text-center">
                    <p className="text-xs font-bold text-indigo-500">02. Analyze</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Skills match</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 text-center">
                    <p className="text-xs font-bold text-indigo-500">03. Tailor</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Export resume</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-2 rounded-xl border border-border/40 bg-muted/10 px-4 py-2.5 text-xs text-muted-foreground">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Pro Tip: Resumes optimized with exact keywords get up to 3x more interview callbacks.</span>
                </div>
              </div>
            )}

            {/* State 2: Loading State */}
            {loading && (
              <div className="flex min-h-[480px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 p-8 text-center backdrop-blur-xs">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-500">
                  <LoaderCircle className="h-7 w-7 animate-spin" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  Crafting your tailored resume...
                </h3>
                <p className="mt-2 max-w-sm text-xs sm:text-sm text-muted-foreground">
                  Extracting text, comparing against required job qualifications, and synthesizing tailored bullet points.
                </p>

                <div className="mt-6 w-full max-w-xs space-y-2 text-left text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Uploaded document parsed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 text-indigo-500 animate-spin" />
                    <span>Analyzing key competencies & gap</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <span className="h-4 w-4 rounded-full border border-border" />
                    <span>Writing tailored resume sections</span>
                  </div>
                </div>
              </div>
            )}

            {/* State 3: Results Display */}
            {result && resume && (
              <div className="space-y-6">
                {/* Match Score & ATS Overview Bar */}
                <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Optimization Complete</span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold text-foreground">
                        Optimization Analysis
                      </h3>
                    </div>

                    {/* Tab Navigation Controls */}
                    <div className="flex items-center rounded-xl border border-border/70 bg-muted/30 p-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab("tailored")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          activeTab === "tailored"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>Resume</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("diff")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          activeTab === "diff"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                        <span>Diff View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("cover-letter")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          activeTab === "cover-letter"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Cover Letter</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Multi-metric counters */}
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        JD Match Score
                      </p>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold tracking-tight text-foreground">
                          {result.match_score}%
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-semibold border ${getScoreColor(
                            result.match_score
                          )}`}
                        >
                          {result.match_score >= 80 ? "High" : result.match_score >= 60 ? "Med" : "Low"}
                        </span>
                      </div>
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                          style={{
                            width: `${Math.max(0, Math.min(100, result.match_score))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        ATS Readiness
                      </p>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold tracking-tight text-indigo-500">
                          {result.ats_score ?? 88}%
                        </span>
                        <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-500">
                          Optimized
                        </span>
                      </div>
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-500"
                          style={{
                            width: `${result.ats_score ?? 88}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Matched Keywords
                      </p>
                      <p className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-500">
                        {result.matched_keywords?.length || 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Found in profile</p>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Missing Gaps
                      </p>
                      <p className="mt-1 text-2xl font-extrabold tracking-tight text-amber-500">
                        {result.missing_keywords?.length || 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Skill gaps</p>
                    </div>
                  </div>
                </div>

                {/* TAB 1: TAILORED RESUME */}
                {activeTab === "tailored" && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Keywords Breakdown */}
                    <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">
                          <Check className="h-3.5 w-3.5" />
                          <span>Matched Keywords ({result.matched_keywords?.length || 0})</span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {result.matched_keywords?.length ? (
                            result.matched_keywords.map((kw, i) => (
                              <span
                                key={`${kw}-${i}`}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                              >
                                <Check className="h-3 w-3" />
                                {kw}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">None detected.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                          <Target className="h-3.5 w-3.5" />
                          <span>Missing / Gap Keywords ({result.missing_keywords?.length || 0})</span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {result.missing_keywords?.length ? (
                            result.missing_keywords.map((kw, i) => (
                              <span
                                key={`${kw}-${i}`}
                                className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
                              >
                                {kw}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">No keyword gaps found!</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tailored Resume Document */}
                    <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-indigo-500" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            Tailored Resume Preview
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={copyResume}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              downloadText(resumeToText(resume), "tailored-resume.txt")
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition"
                          >
                            <ArrowDownToLine className="h-3.5 w-3.5" />
                            <span>Download (.txt)</span>
                          </button>
                        </div>
                      </div>

                      {/* Clean Document View */}
                      <article className="mt-5 rounded-xl border border-border/70 bg-background/50 p-6 sm:p-8 space-y-6">
                        {/* Header: Name & Contact */}
                        <div className="border-b-2 border-indigo-500/60 pb-4">
                          <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {resume.full_name || "Candidate Name"}
                          </h1>
                          {resume.professional_title && (
                            <p className="mt-1 text-sm font-semibold text-indigo-500 dark:text-indigo-400">
                              {resume.professional_title}
                            </p>
                          )}
                          {resume.contact_info?.length > 0 && (
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              {resume.contact_info.join(" · ")}
                            </p>
                          )}
                        </div>

                        {/* Summary */}
                        {resume.summary && (
                          <div>
                            <h4 className="resume-heading">Professional Summary</h4>
                            <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                              {resume.summary}
                            </p>
                          </div>
                        )}

                        {/* Skills */}
                        {resume.skills?.length > 0 && (
                          <div>
                            <h4 className="resume-heading">Core Competencies & Skills</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {resume.skills.map((skill, index) => (
                                <span
                                  key={`${skill}-${index}`}
                                  className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Experience, Education, Projects */}
                        {[
                          { title: "Experience", items: resume.experience },
                          { title: "Education", items: resume.education },
                          { title: "Projects", items: resume.projects },
                        ].map(({ title, items }) => {
                          if (!items || items.length === 0) return null
                          return (
                            <div key={title}>
                              <h4 className="resume-heading">{title}</h4>
                              <div className="space-y-4">
                                {items.map((sec, i) => (
                                  <div key={`${sec.heading}-${i}`}>
                                    <h5 className="text-xs sm:text-sm font-semibold text-foreground">
                                      {sec.heading}
                                    </h5>
                                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                                      {sec.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}

                        {/* Certifications */}
                        {resume.certifications?.length > 0 && (
                          <div>
                            <h4 className="resume-heading">Certifications</h4>
                            <ul className="list-inside list-disc space-y-1 text-xs sm:text-sm text-muted-foreground">
                              {resume.certifications.map((cert, i) => (
                                <li key={`${cert}-${i}`}>{cert}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </article>
                    </div>

                    {/* Suggestions & Changes */}
                    {(result.suggestions?.length > 0 || result.changes_made?.length > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.suggestions?.length > 0 && (
                          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
                            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 dark:text-indigo-400">
                              <Lightbulb className="h-4 w-4" />
                              <span>AI Suggestions</span>
                            </div>
                            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                              {result.suggestions.map((sug, i) => (
                                <li key={`${sug}-${i}`} className="flex items-start gap-2">
                                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                                  <span>{sug}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.changes_made?.length > 0 && (
                          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Key Adjustments Made</span>
                            </div>
                            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                              {result.changes_made.map((chg, i) => (
                                <li key={`${chg}-${i}`} className="flex items-start gap-2">
                                  <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  <span>{chg}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: DIFF VIEW */}
                {activeTab === "diff" && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Summary of Changes banner */}
                    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 dark:text-indigo-400">
                        <GitCompare className="h-4 w-4" />
                        <span>Comparison & Adjustment Insights</span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        Comparing your original document against the newly synthesized, ATS-optimized version.
                      </p>
                      {result.changes_made?.length > 0 && (
                        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                          {result.changes_made.map((chg, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-background/60 px-3 py-1.5 text-xs text-foreground"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate">{chg}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Side-by-side comparison grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Left: Original Extracted Resume */}
                      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[11px] font-bold">
                              A
                            </span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Original Uploaded Resume
                            </h4>
                          </div>
                          <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                            Parsed text
                          </span>
                        </div>
                        <div className="mt-4 max-h-[550px] overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap select-text">
                          {result.original_text ||
                            "Original resume text loaded from document parser."}
                        </div>
                      </div>

                      {/* Right: Tailored Version */}
                      <div className="rounded-2xl border border-indigo-500/40 bg-card p-5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-500 text-[11px] font-bold">
                              B
                            </span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                              Tailored & ATS-Aligned
                            </h4>
                          </div>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                            {result.match_score}% Match
                          </span>
                        </div>
                        <div className="mt-4 max-h-[550px] overflow-y-auto rounded-xl border border-indigo-500/20 bg-background/80 p-4 font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap select-text">
                          {resumeToText(resume)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: COVER LETTER GENERATOR */}
                {activeTab === "cover-letter" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            AI Cover Letter Studio
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Generate a role-specific cover letter using your uploaded resume and JD
                          </p>
                        </div>
                      </div>

                      {/* Cover letter inputs */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-muted-foreground">
                            Target Company Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Acme Corp or Vercel"
                            className="mt-1 w-full rounded-xl border border-border/80 bg-muted/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-indigo-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-muted-foreground">
                            Target Role Title (Optional)
                          </label>
                          <input
                            type="text"
                            value={roleTitle}
                            onChange={(e) => setRoleTitle(e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                            className="mt-1 w-full rounded-xl border border-border/80 bg-muted/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-indigo-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateCoverLetter}
                        disabled={coverLetterLoading}
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition disabled:opacity-60"
                      >
                        {coverLetterLoading ? (
                          <>
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            <span>Synthesizing Cover Letter...</span>
                          </>
                        ) : (
                          <>
                            <WandSparkles className="h-3.5 w-3.5" />
                            <span>
                              {coverLetter
                                ? "Regenerate Cover Letter"
                                : "Generate Tailored Cover Letter"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Cover Letter Document Output */}
                    {coverLetter && (
                      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs animate-in fade-in">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                              Generated Cover Letter
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={copyCoverLetter}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition"
                            >
                              {coverLetterCopied ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  <span className="text-emerald-500 font-semibold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>Copy Text</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const fullLetter = `${coverLetter.salutation}\n\n${coverLetter.letter_body}\n\nSincerely,\n${
                                  resume.full_name || "Applicant"
                                }`
                                downloadText(fullLetter, "tailored-cover-letter.txt")
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition"
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" />
                              <span>Download (.txt)</span>
                            </button>
                          </div>
                        </div>

                        {/* Highlighted strengths */}
                        {coverLetter.key_strengths_highlighted?.length > 0 && (
                          <div className="mt-4 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              Strengths Highlighted:
                            </span>
                            {coverLetter.key_strengths_highlighted.map((s, i) => (
                              <span
                                key={i}
                                className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-500"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <article className="mt-5 rounded-xl border border-border/70 bg-background/50 p-6 sm:p-8 space-y-4 font-sans text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                          <p className="font-semibold text-foreground">
                            {coverLetter.salutation}
                          </p>
                          <p>{coverLetter.letter_body}</p>
                          <div className="pt-4 border-t border-border/40">
                            <p>Sincerely,</p>
                            <p className="font-bold text-foreground mt-1">
                              {resume.full_name || "Applicant"}
                            </p>
                            {resume.contact_info?.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {resume.contact_info[0]}
                              </p>
                            )}
                          </div>
                        </article>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <footer className="mt-16 border-t border-border/50 pt-8 pb-12 text-center text-xs text-muted-foreground">
          <p>ResumeCraft · Powered by Next.js, FastAPI & Google Gemini AI.</p>
          <p className="mt-1 opacity-70">
            Tailor your resume responsibly to truthfully highlight your authentic experience.
          </p>
        </footer>
      </div>
    </main>
  )
}
