"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Search,
  Filter,
  Download,
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Employee {
  id: string
  name: string
  email: string
  company: string
  position: string
  contact?: string
  status: "exact" | "partial" | "invalid" | "pending"
  linkedinUrl?: string
  apolloData?: {
    verifiedName: string
    verifiedEmail: string
    verifiedCompany: string
    verifiedPosition: string
    linkedinVerified: boolean
    photoUrl?: string
    headline?: string
    location?: string
    phoneNumbers?: string[]
  }
}

export default function AnalysisPage() {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [fileName, setFileName] = useState("")
  const [fileId, setFileId] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const uploadedFileId = localStorage.getItem("uploadedFileId")
    const uploadedFileName = localStorage.getItem("uploadedFileName")

    if (!uploadedFileId || !uploadedFileName) {
      router.push("/")
      return
    }

    setFileId(uploadedFileId)
    setFileName(uploadedFileName)
    loadEmployeeData(uploadedFileId)
  }, [router])

  const loadEmployeeData = async (fileId: string) => {
    try {
      const response = await fetch(`/api/employees/${fileId}`)
      const data = await response.json()

      if (data.success) {
        setEmployees(data.employees || [])
      } else {
        setError(data.error || "Failed to load employee data")
      }
    } catch (error) {
      console.error("Error loading employee data:", error)
      setError("Failed to load employee data")
    }
  }

  const stats = {
    total: employees.length,
    exact: employees.filter((e) => e.status === "exact").length,
    partial: employees.filter((e) => e.status === "partial").length,
    invalid: employees.filter((e) => e.status === "invalid").length,
    pending: employees.filter((e) => e.status === "pending").length,
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStartAnalysis = async () => {
    if (!fileId) return

    setIsAnalyzing(true)
    setProgress(0)
    setError(null)

    try {
      const response = await fetch("/api/analysis/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      })

      const result = await response.json()

      if (result.success) {
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/analysis/status?fileId=${fileId}`)
            const status = await statusResponse.json()

            if (status.success) {
              setProgress(status.progress)
              setEmployees(status.employees || [])

              if (status.progress >= 100) {
                clearInterval(pollInterval)
                setIsAnalyzing(false)
              }
            }
          } catch (error) {
            console.error("Error polling status:", error)
          }
        }, 2000) // Poll every 2 seconds for smoother updates
      } else {
        setError(result.error || "Analysis failed to start")
        setIsAnalyzing(false)
      }
    } catch (error) {
      console.error("Analysis error:", error)
      setError("Analysis failed. Please try again.")
      setIsAnalyzing(false)
    }
  }

  const handleReset = async () => {
    setProgress(0)
    setIsAnalyzing(false)
    setExpandedRows(new Set())
    await loadEmployeeData(fileId)
  }

  const handleDownload = async (type: "all" | "exact" | "partial" | "invalid") => {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, type }),
      })

      const result = await response.json()

      if (result.success && result.csvData) {
        const blob = new Blob([result.csvData], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${type}_results_${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        setError(result.error || "Download failed")
      }
    } catch (error) {
      console.error("Download error:", error)
      setError("Download failed. Please try again.")
    }
  }

  const toggleRowExpansion = (employeeId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId)
    } else {
      newExpanded.add(employeeId)
    }
    setExpandedRows(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      exact: <Badge className="bg-green-100 text-green-800 hover:bg-green-100 status-badge">Exact Match</Badge>,
      partial: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 status-badge">Partial Match</Badge>,
      invalid: <Badge className="bg-red-100 text-red-800 hover:bg-red-100 status-badge">No Match</Badge>,
      pending: <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 status-badge">Pending</Badge>,
    }
    return badges[status as keyof typeof badges] || null
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      exact: <CheckCircle className="h-4 w-4 text-green-600" />,
      partial: <AlertCircle className="h-4 w-4 text-yellow-600" />,
      invalid: <XCircle className="h-4 w-4 text-red-600" />,
      pending: <div className="h-4 w-4 rounded-full bg-gray-300 pulse-slow" />,
    }
    return icons[status as keyof typeof icons] || null
  }

  const getMatchIcon = (original: string, verified: string) => {
    const isMatch = original.toLowerCase().trim() === verified.toLowerCase().trim()
    return isMatch ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }

  if (!fileId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="spinner rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 page-transition">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 fade-in">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4 nav-transition">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>

          <div className="mb-4">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Profile Analysis</h1>
            <p className="text-gray-600 text-lg">
              Analyzing {employees.length} employee records from <span className="font-medium">{fileName}</span> with
              Apollo API validation
            </p>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 error-state">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Analysis Controls */}
        <Card className="mb-6 shadow-lg card-hover slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="bg-blue-100 p-2 rounded">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
              Apollo API Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 btn-transition"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                {isAnalyzing ? "Analyzing..." : "Start Apollo Analysis"}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isAnalyzing}
                size="lg"
                className="btn-transition"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Analysis Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 progress-smooth" />
              <p className="text-sm text-gray-600">
                {Math.floor((progress / 100) * employees.length)} of {employees.length} employees analyzed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { key: "total", label: "Total Records", color: "bg-blue-600", count: stats.total },
            { key: "exact", label: "Exact Match", color: "bg-green-600", count: stats.exact },
            { key: "partial", label: "Partial Match", color: "bg-yellow-600", count: stats.partial },
            { key: "invalid", label: "No Match", color: "bg-red-600", count: stats.invalid },
          ].map(({ key, label, color, count }, index) => (
            <Card
              key={key}
              className={`${color} text-white stats-card shadow-lg`}
              onClick={() => handleDownload(key as "all" | "exact" | "partial" | "invalid")}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold mb-1">{count}</div>
                <div className="text-sm opacity-90">{label}</div>
                <div className="text-xs opacity-75 mt-1">Click to download</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 shadow-lg card-hover scale-in">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 search-input"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 border-smooth">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="exact">Exact Match</SelectItem>
                  <SelectItem value="partial">Partial Match</SelectItem>
                  <SelectItem value="invalid">No Match</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => handleDownload("all")} className="btn-transition">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="shadow-lg card-hover">
          <CardHeader>
            <CardTitle className="text-xl">Results ({filteredEmployees.length})</CardTitle>
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600 mt-4 px-4">
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Name</div>
              <div className="col-span-2">Email</div>
              <div className="col-span-2">Company</div>
              <div className="col-span-2">Position</div>
              <div className="col-span-1">LinkedIn</div>
              <div className="col-span-1">Actions</div>
            </div>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-12 fade-in">
                <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No employee data found. Please upload a valid file.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((employee, index) => (
                  <div
                    key={employee.id}
                    className="border rounded-lg fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Main Row */}
                    <div className="p-4 table-row-transition">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(employee.status)}
                            {getStatusBadge(employee.status)}
                          </div>
                        </div>
                        <div className="col-span-2 font-medium">{employee.name}</div>
                        <div className="col-span-2 text-gray-600 text-sm">{employee.email}</div>
                        <div className="col-span-2">{employee.company}</div>
                        <div className="col-span-2">{employee.position}</div>
                        <div className="col-span-1">
                          {employee.linkedinUrl ? (
                            <a
                              href={employee.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm text-smooth"
                            >
                              Profile
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-gray-500 text-sm">Not found</span>
                          )}
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRowExpansion(employee.id)}
                            className="w-full btn-transition"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                            {expandedRows.has(employee.id) ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedRows.has(employee.id) && (
                      <div className="border-t bg-gray-50 p-6 expand">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Original Data */}
                          <Card className="card-hover">
                            <CardHeader>
                              <CardTitle className="text-lg">Original Data</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600">Name:</label>
                                <p className="font-medium">{employee.name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Email:</label>
                                <p className="font-medium">{employee.email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Company:</label>
                                <p className="font-medium">{employee.company}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Position:</label>
                                <p className="font-medium">{employee.position}</p>
                              </div>
                              {employee.contact && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Contact:</label>
                                  <p className="font-medium">{employee.contact}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Apollo Data */}
                          <Card className="card-hover">
                            <CardHeader>
                              <CardTitle className="text-lg">API Data</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {employee.apolloData ? (
                                <>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">LinkedIn:</label>
                                    <div className="flex items-center gap-2">
                                      {employee.linkedinUrl ? (
                                        <a
                                          href={employee.linkedinUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-smooth"
                                        >
                                          View Profile
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : (
                                        <span className="text-gray-500">Not found</span>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Verified:</label>
                                    <p className="font-medium">{employee.apolloData.linkedinVerified ? "Yes" : "No"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Name in API:</label>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{employee.apolloData.verifiedName}</p>
                                      {getMatchIcon(employee.name, employee.apolloData.verifiedName)}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Email in API:</label>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{employee.apolloData.verifiedEmail}</p>
                                      {getMatchIcon(employee.email, employee.apolloData.verifiedEmail)}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Company in API:</label>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{employee.apolloData.verifiedCompany}</p>
                                      {getMatchIcon(employee.company, employee.apolloData.verifiedCompany)}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Position in API:</label>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{employee.apolloData.verifiedPosition}</p>
                                      {getMatchIcon(employee.position, employee.apolloData.verifiedPosition)}
                                    </div>
                                  </div>
                                  {employee.apolloData.headline && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Headline:</label>
                                      <p className="font-medium">{employee.apolloData.headline}</p>
                                    </div>
                                  )}
                                  {employee.apolloData.location && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Location:</label>
                                      <p className="font-medium">{employee.apolloData.location}</p>
                                    </div>
                                  )}
                                  {employee.apolloData.phoneNumbers && employee.apolloData.phoneNumbers.length > 0 && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Phone Numbers:</label>
                                      <div className="space-y-1">
                                        {employee.apolloData.phoneNumbers.map((phone, idx) => (
                                          <p key={idx} className="font-medium text-sm">
                                            {phone}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-center py-8">
                                  <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                                  <p className="text-gray-600">No Apollo data found for this employee</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        {/* Match Summary */}
                        {employee.apolloData && (
                          <Card className="mt-6 card-hover">
                            <CardHeader>
                              <CardTitle className="text-lg">Field Validation Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                  {
                                    field: "Name",
                                    original: employee.name,
                                    verified: employee.apolloData.verifiedName,
                                  },
                                  {
                                    field: "Email",
                                    original: employee.email,
                                    verified: employee.apolloData.verifiedEmail,
                                  },
                                  {
                                    field: "Company",
                                    original: employee.company,
                                    verified: employee.apolloData.verifiedCompany,
                                  },
                                  {
                                    field: "Position",
                                    original: employee.position,
                                    verified: employee.apolloData.verifiedPosition,
                                  },
                                ].map(({ field, original, verified }, idx) => {
                                  const isMatch = original.toLowerCase().trim() === verified.toLowerCase().trim()
                                  return (
                                    <div
                                      key={field}
                                      className="text-center p-3 bg-gray-50 rounded-lg border hover-lift"
                                      style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                      <div className="flex items-center justify-center gap-2 mb-2">
                                        {isMatch ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className="font-medium">{field}</span>
                                      </div>
                                      <Badge variant={isMatch ? "default" : "destructive"} className="status-badge">
                                        {isMatch ? "Match" : "Different"}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
