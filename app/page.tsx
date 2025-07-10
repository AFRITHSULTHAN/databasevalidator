"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, Info, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (selectedFile: File) => {
    setError(null)

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ]

    const validExtensions = [".xlsx", ".xls", ".csv"]
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf("."))

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      setError("Please select a valid Excel (.xlsx, .xls) or CSV file")
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB")
      return
    }

    setFile(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleChooseFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        localStorage.setItem("uploadedFileId", result.fileId)
        localStorage.setItem("uploadedFileName", file.name)
        router.push("/analysis")
      } else {
        setError(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError("Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 page-transition">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8 fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-blue-600 p-3 rounded-lg card-hover">
              <FileSpreadsheet className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900">Database Validator</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto slide-up">
            Upload your Excel or CSV files with employee data and validate LinkedIn profiles using Apollo API
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 error-state">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <Card className="mb-8 shadow-lg card-hover scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Upload className="h-6 w-6" />
                Upload Employee Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`upload-area rounded-xl p-12 text-center transition-all duration-300 ${
                  isDragging
                    ? "dragover"
                    : file
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {file ? (
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6 scale-in" />
                ) : (
                  <Upload className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                )}

                <h3 className="text-2xl font-semibold mb-3 text-smooth">
                  {file ? "File Selected Successfully" : "Upload Employee Data"}
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {file
                    ? "Ready to process your file"
                    : "Drag and drop your Excel or CSV file here, or click to browse"}
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <Button
                  variant="outline"
                  onClick={handleChooseFileClick}
                  className="cursor-pointer text-lg px-8 py-3 btn-transition hover-lift"
                  size="lg"
                >
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Choose File
                </Button>

                {file && (
                  <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-200 fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-800">File Name:</span>
                        <p className="text-green-700">{file.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Size:</span>
                        <p className="text-green-700">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Type:</span>
                        <p className="text-green-700">{file.type || "Unknown"}</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-6">Supported formats: .xlsx, .xls, .csv • Maximum size: 10MB</p>
              </div>

              {file && (
                <div className="mt-8 text-center slide-up">
                  <Button
                    onClick={handleUpload}
                    size="lg"
                    disabled={isUploading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-12 py-4 btn-transition"
                  >
                    {isUploading ? (
                      <>
                        <div className="spinner rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing File...
                      </>
                    ) : (
                      "Start Analysis"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg card-hover slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Info className="h-6 w-6" />
                File Format Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">✅ Required Columns (Minimum)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Name</span> - Employee full name
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Email</span> - Valid email address
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">🎯 Recommended Columns</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Company</span> - Organization name
                    </div>
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Position</span> - Job title/role
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border fade-in">
                <h4 className="font-semibold text-gray-800 mb-3">🔍 Smart Column Detection</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="hover-lift">
                    <strong>Name variations:</strong> "Name", "Full Name", "Employee Name", "First Name", "Full_Name"
                  </div>
                  <div className="hover-lift">
                    <strong>Email variations:</strong> "Email", "Email Address", "E-mail", "Work Email", "E_Mail"
                  </div>
                  <div className="hover-lift">
                    <strong>Company variations:</strong> "Company", "Organization", "Employer", "Company Name", "Org"
                  </div>
                  <div className="hover-lift">
                    <strong>Position variations:</strong> "Position", "Title", "Job Title", "Role", "Designation"
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200 scale-in">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Flexible parsing:</strong> Works with different delimiters (comma, semicolon, tab),
                    multiple languages, and various naming conventions
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">📝 Sample CSV Format</h4>
                <pre className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded overflow-x-auto">
                  {`Name,Email,Company,Position
John Smith,john.smith@techcorp.com,TechCorp,Software Engineer
Sarah Johnson,sarah.j@startup.io,Startup Inc,Product Manager
David Lee,david.lee@initech.com,Initech,Business Analyst`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
