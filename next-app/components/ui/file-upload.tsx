"use client"

import * as React from "react"
import { UploadCloud, FileText, X, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FileUploadProps {
  file?: File | null
  onFileSelect?: (file: File | null) => void
  accept?: string
  maxSizeMB?: number
  className?: string
  disabled?: boolean
  error?: string | null
}

export function FileUpload({
  file: controlledFile,
  onFileSelect,
  accept = ".pdf,.docx",
  maxSizeMB = 5,
  className,
  disabled = false,
  error: externalError,
}: FileUploadProps) {
  const [internalFile, setInternalFile] = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const activeFile = controlledFile !== undefined ? controlledFile : internalFile
  const error = externalError || localError

  const validateAndSetFile = (selectedFile: File) => {
    setLocalError(null)

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || ""
    if (!["pdf", "docx"].includes(extension)) {
      setLocalError("Please upload a PDF or DOCX file.")
      return
    }

    if (selectedFile.size === 0) {
      setLocalError("The selected file is empty.")
      return
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`File size exceeds the ${maxSizeMB}MB limit.`)
      return
    }

    if (controlledFile === undefined) {
      setInternalFile(selectedFile)
    }
    onFileSelect?.(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalError(null)
    if (inputRef.current) inputRef.current.value = ""
    if (controlledFile === undefined) {
      setInternalFile(null)
    }
    onFileSelect?.(null)
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0]
          if (selected) validateAndSetFile(selected)
        }}
      />

      {!activeFile ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          className={cn(
            "group relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 outline-hidden select-none",
            isDragging
              ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
              : "border-border/70 bg-muted/20 hover:border-indigo-500/60 hover:bg-muted/40",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition-transform duration-200 group-hover:scale-110 dark:bg-indigo-400/10 dark:text-indigo-400">
            <UploadCloud className="h-6 w-6" />
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-sm font-medium text-foreground">
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline-offset-2 hover:underline">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PDF or DOCX (Max {maxSizeMB}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 transition-all">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {activeFile.name}
                </p>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">
                {(activeFile.size / 1024).toFixed(1)} KB · Ready to customize
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={removeFile}
            aria-label="Remove resume"
            title="Remove uploaded file"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-destructive animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  )
}
