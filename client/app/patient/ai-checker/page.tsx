"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import {
  BrainCircuit,
  AlertTriangle,
  ChevronRight,
  Loader2,
  ArrowLeft,
  History,
  Sparkles,
} from "lucide-react"

import api from "@/services/api"
import { useAuthStore } from "@/store/authStore"
import { Sidebar } from "@/components/ui/Sidebar"
import { GlassCard } from "@/components/ui/GlassCard"
import { AnimatedButton } from "@/components/ui/AnimatedButton"
import { cn } from "@/lib/utils"

interface SymptomHistoryItem {
  id: string
  submittedSymptoms: string[]
  urgency: string
  recommendedDoctorSpecialty: string
  preliminaryHealthSuggestion: string
  createdAt: string
}

interface SymptomCheckResponse {
  id: string
  submittedSymptoms: string[]
  durationDays: number
  severity: string
  urgency: string
  preliminaryHealthSuggestion: string
  suggestedNextSteps: string[]
  recommendedDoctorSpecialty: string
  possibleConditions: string[]
  redFlags: string[]
  disclaimer: string
  createdAt: string
}

const commonSymptoms = [
  "Fever",
  "Cough",
  "Sore throat",
  "Headache",
  "Body pain",
  "Fatigue",
  "Rash",
  "Itching",
  "Abdominal pain",
  "Vomiting",
  "Diarrhea",
  "Joint pain",
  "Swelling",
  "Chest pain",
  "Shortness of breath",
  "Blurred vision",
  "Dizziness",
  "Ear pain",
  "Sinus pain",
  "Palpitations",
  "Weakness",
  "Numbness",
]

function urgencyClasses(urgency: string) {
  switch ((urgency || "").toUpperCase()) {
    case "EMERGENCY":
      return "bg-red-100 text-red-700 border-red-200"
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200"
    case "MEDIUM":
      return "bg-amber-100 text-amber-700 border-amber-200"
    default:
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
  }
}

function ResultPanel({ data }: { data: SymptomCheckResponse }) {
  return (
    <GlassCard className="border border-slate-200 bg-white p-0 shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">AI Symptom Check Result</h3>
            <p className="mt-1 text-sm text-slate-500">
              Submitted on {new Date(data.createdAt).toLocaleString()}
            </p>
          </div>

          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold",
              urgencyClasses(data.urgency)
            )}
          >
            {data.urgency} priority
          </span>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-600">Submitted symptoms</p>
          <div className="flex flex-wrap gap-2">
            {data.submittedSymptoms.map((symptom) => (
              <span
                key={symptom}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-1 text-sm font-semibold text-slate-600">
              Recommended doctor specialty
            </p>
            <p className="text-lg font-bold text-slate-900">
              {data.recommendedDoctorSpecialty}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-1 text-sm font-semibold text-slate-600">
              Symptom duration / severity
            </p>
            <p className="text-lg font-bold capitalize text-slate-900">
              {data.durationDays} day(s) / {data.severity}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-600">
            Preliminary health suggestion
          </p>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 leading-7 text-slate-700">
            {data.preliminaryHealthSuggestion}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-600">Suggested next steps</p>
          <div className="space-y-2">
            {data.suggestedNextSteps.map((step, index) => (
              <div
                key={`${step}-${index}`}
                className="flex gap-3 rounded-2xl border border-slate-200 p-4 text-slate-700"
              >
                <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {data.possibleConditions?.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-600">
              Possible health categories
            </p>
            <div className="flex flex-wrap gap-2">
              {data.possibleConditions.map((condition) => (
                <span
                  key={condition}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.redFlags?.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-700">Red-flag symptoms detected</p>
                <p className="mt-1 text-sm text-red-600">{data.redFlags.join(", ")}</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          {data.disclaimer}
        </div>
      </div>
    </GlassCard>
  )
}

export default function PatientAiCheckerPage() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const router = useRouter()

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [customSymptom, setCustomSymptom] = useState("")
  const [durationDays, setDurationDays] = useState("")
  const [severity, setSeverity] = useState("moderate")
  const [additionalNotes, setAdditionalNotes] = useState("")

  const [analyzing, setAnalyzing] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false)

  const [result, setResult] = useState<SymptomCheckResponse | null>(null)
  const [history, setHistory] = useState<SymptomHistoryItem[]>([])
  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<SymptomCheckResponse | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "ROLE_PATIENT" && user?.role !== "PATIENT") {
      router.push("/")
      return
    }

    fetchHistory()
  }, [isAuthenticated, user, router])

  if (!user || (user.role !== "ROLE_PATIENT" && user.role !== "PATIENT")) {
    return null
  }

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const res = await api.get("/ai/history/me")
      setHistory(res.data || [])
    } catch (error) {
      console.error("Failed to load symptom history:", error)
      toast.error("Failed to load symptom history")
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchHistoryDetail = async (id: string) => {
    try {
      setHistoryDetailLoading(true)
      const res = await api.get(`/ai/history/${id}`)
      setSelectedHistoryItem(res.data)
    } catch (error) {
      console.error("Failed to load history result:", error)
      toast.error("Failed to load selected history result")
    } finally {
      setHistoryDetailLoading(false)
    }
  }

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((item) => item !== symptom)
        : [...prev, symptom]
    )
  }

  const addCustomSymptom = () => {
    const normalized = customSymptom.trim()
    if (!normalized) return

    const formatted = normalized
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")

    if (!selectedSymptoms.includes(formatted)) {
      setSelectedSymptoms((prev) => [...prev, formatted])
    }

    setCustomSymptom("")
  }

  const resetSymptomForm = () => {
    setSelectedSymptoms([])
    setCustomSymptom("")
    setDurationDays("")
    setSeverity("moderate")
    setAdditionalNotes("")
    setResult(null)
    setSelectedHistoryItem(null)
  }

  const submitSymptomCheck = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error("Please select or add at least one symptom")
      return
    }

    if (!durationDays) {
      toast.error("Please provide symptom duration in days")
      return
    }

    try {
      setAnalyzing(true)
      setSelectedHistoryItem(null)

      const payload = {
        symptoms: selectedSymptoms,
        durationDays: Number(durationDays),
        severity,
        additionalNotes,
      }

      const res = await api.post("/ai/check", payload)
      setResult(res.data)
      toast.success("Symptom analysis completed")
      fetchHistory()
    } catch (error: any) {
      console.error("Failed to analyze symptoms:", error)
      toast.error(error?.response?.data?.message || "Failed to analyze symptoms")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PATIENT" />

      <main className="flex-1 p-4 pt-20 transition-all duration-300 md:p-8 md:pt-24 lg:ml-[80px] lg:pt-8 xl:ml-[280px]">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3">
                <button
                  onClick={() => router.push("/patient/dashboard")}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </button>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                AI Symptom Checker
              </h1>
              <p className="mt-1 max-w-2xl text-slate-500">
                Submit your symptoms to receive preliminary health suggestions,
                suggested next steps, recommended doctor specialty, and saved history.
              </p>
            </div>

            <div className="flex gap-3">
              <AnimatedButton
                variant="outline"
                onClick={fetchHistory}
                className="h-11 px-5"
              >
                <History className="mr-2 h-4 w-4" />
                Refresh History
              </AnimatedButton>

              <AnimatedButton
                variant="primary"
                onClick={() => router.push("/doctor")}
                className="h-11 px-5"
              >
                Find Doctors
              </AnimatedButton>
            </div>
          </div>

          <div className="grid items-start gap-8 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-8">
              <GlassCard className="border border-slate-200 bg-white p-0 shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Check Your Symptoms
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Add symptoms, symptom duration, severity, and any important
                        notes. The AI service will return preliminary guidance and a
                        suggested specialty.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-600">
                      Common symptoms
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {commonSymptoms.map((symptom) => {
                        const selected = selectedSymptoms.includes(symptom)
                        return (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => toggleSymptom(symptom)}
                            className={cn(
                              "rounded-full border px-3 py-2 text-sm transition-colors",
                              selected
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-slate-300 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50"
                            )}
                          >
                            {symptom}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr,auto]">
                    <input
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addCustomSymptom()
                        }
                      }}
                      placeholder="Add another symptom manually"
                      className="h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />

                    <AnimatedButton
                      variant="outline"
                      onClick={addCustomSymptom}
                      className="h-11 px-5"
                    >
                      Add Symptom
                    </AnimatedButton>
                  </div>

                  {selectedSymptoms.length > 0 && (
                    <div>
                      <p className="mb-3 text-sm font-semibold text-slate-600">
                        Selected symptoms
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSymptoms.map((symptom) => (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => toggleSymptom(symptom)}
                            className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                          >
                            {symptom} ×
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        Duration (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                        placeholder="e.g. 3"
                        className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        Severity
                      </label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">
                      Additional notes
                    </label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      rows={5}
                      maxLength={700}
                      placeholder="Describe when symptoms started, what makes them worse, or any unusual details."
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <AnimatedButton
                      variant="primary"
                      onClick={submitSymptomCheck}
                      disabled={analyzing}
                      className="h-11 px-6"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze Symptoms
                        </>
                      )}
                    </AnimatedButton>

                    <AnimatedButton
                      variant="outline"
                      onClick={resetSymptomForm}
                      className="h-11 px-6"
                    >
                      Reset
                    </AnimatedButton>
                  </div>
                </div>
              </GlassCard>

              {result && <ResultPanel data={result} />}
            </div>

            <div className="space-y-8">
              <GlassCard className="border border-slate-200 bg-white p-0 shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <h2 className="text-xl font-bold text-slate-900">My Symptom History</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review your previous AI symptom checks and open a full saved result.
                  </p>
                </div>

                <div className="p-6">
                  {historyLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading history...
                    </div>
                  ) : history.length > 0 ? (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => fetchHistoryDetail(item.id)}
                          className="w-full rounded-2xl border border-slate-200 p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                {item.submittedSymptoms.join(", ")}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <span
                              className={cn(
                                "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
                                urgencyClasses(item.urgency)
                              )}
                            >
                              {item.urgency}
                            </span>
                          </div>

                          <p className="mb-2 text-sm text-slate-600">
                            {item.recommendedDoctorSpecialty}
                          </p>
                          <p className="line-clamp-2 text-sm text-slate-500">
                            {item.preliminaryHealthSuggestion}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                      No symptom checks yet. Submit your first analysis to build history.
                    </div>
                  )}
                </div>
              </GlassCard>

              {(historyDetailLoading || selectedHistoryItem) && (
                <div>
                  {historyDetailLoading ? (
                    <GlassCard className="border border-slate-200 bg-white p-8 text-center shadow-sm">
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading result...
                      </div>
                    </GlassCard>
                  ) : selectedHistoryItem ? (
                    <ResultPanel data={selectedHistoryItem} />
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                logout()
                router.push("/login")
              }}
              className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}