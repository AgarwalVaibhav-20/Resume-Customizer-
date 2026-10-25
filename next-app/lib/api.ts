const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://resume-customizer-iota.vercel.app"
).replace(/\/+$/, "")

export interface ResumeSection {
  heading: string
  content: string
}

export interface TailoredResume {
  full_name: string
  professional_title: string
  contact_info: string[]
  summary: string
  skills: string[]
  experience: ResumeSection[]
  education: ResumeSection[]
  projects: ResumeSection[]
  certifications: string[]
}

export interface CustomizationResult {
  success: boolean
  resume: TailoredResume
  match_score: number
  matched_keywords: string[]
  missing_keywords: string[]
  suggestions: string[]
  changes_made: string[]
}

export async function customizeResume(
  jobDescription: string,
  file: File
): Promise<CustomizationResult> {
  const formData = new FormData()

  formData.append("job_description", jobDescription)
  formData.append("file", file)

  let response: Response

  try {
    response = await fetch(`${API_URL}/api/v1/customize`, {
      method: "POST",
      body: formData,
    })
  } catch {
    throw new Error(
      "Cannot connect to the backend. Check that FastAPI is running."
    )
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : "Resume customization failed. Please try again."

    throw new Error(message)
  }

  return data as CustomizationResult
}
