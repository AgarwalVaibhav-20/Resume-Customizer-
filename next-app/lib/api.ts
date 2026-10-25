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
  ats_score?: number
  matched_keywords: string[]
  missing_keywords: string[]
  suggestions: string[]
  changes_made: string[]
  original_text?: string
  customized_sections?: string[]
}

export interface CoverLetterResult {
  success: boolean
  recipient_title: string
  company_name: string
  role_title: string
  salutation: string
  letter_body: string
  key_strengths_highlighted: string[]
}

export async function customizeResume(
  jobDescription: string,
  file: File,
  sections?: string[]
): Promise<CustomizationResult> {
  const formData = new FormData()

  formData.append("job_description", jobDescription)
  formData.append("file", file)
  if (sections && sections.length > 0) {
    formData.append("sections", sections.join(","))
  }

  let response: Response

  try {
    response = await fetch(`${API_URL}/api/v1/customize`, {
      method: "POST",
      body: formData,
    })
  } catch {
    throw new Error(
      "Cannot connect to the backend. Check that FastAPI is running and CORS is configured."
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

export async function generateCoverLetter(
  jobDescription: string,
  file: File,
  companyName?: string,
  roleTitle?: string
): Promise<CoverLetterResult> {
  const formData = new FormData()

  formData.append("job_description", jobDescription)
  formData.append("file", file)
  if (companyName) formData.append("company_name", companyName)
  if (roleTitle) formData.append("role_title", roleTitle)

  let response: Response

  try {
    response = await fetch(`${API_URL}/api/v1/cover-letter`, {
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
        : "Cover letter generation failed. Please try again."

    throw new Error(message)
  }

  return data as CoverLetterResult
}
