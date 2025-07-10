"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Users,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Activity,
  Zap,
  Target,
  TrendingUp,
  Shield,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface TestResult {
  success: boolean
  testType: string
  message?: string
  responseTime?: string
  details?: any
  input?: any
  output?: any
  stats?: any
  results?: any
  summary?: any
  error?: string
  timestamp: string
}

export default function TestApolloPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [singleEmployee, setSingleEmployee] = useState({
    name: "Chiara Savino",
    email: "chiara.savino@24orecultura.com",
    company: "24 ORE Cultura",
    position: "Responsabile editoriale",
  })

  const [bulkEmployees, setBulkEmployees] = useState(`[
  {
    "name": "John Smith",
    "email": "john.smith@techcorp.com",
    "company": "TechCorp",
    "position": "Software Engineer"
  },
  {
    "name": "Sarah Johnson",
    "email": "sarah.j@startup.io",
    "company": "Startup Inc",
    "position": "Product Manager"
  },
  {
    "name": "David Lee",
    "email": "david.lee@initech.com",
    "company": "Initech",
    "position": "Business Analyst"
  }
]`)

  const runTest = async (testType: string, testData?: any) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-apollo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType, testData }),
      })

      const result = await response.json()
      setTestResults((prev) => [result, ...prev])
    } catch (error) {
      console.error("Test error:", error)
      setTestResults((prev) => [
        {
          success: false,
          testType,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const runSingleEmployeeTest = () => {
    runTest("single_employee", singleEmployee)
  }

  const runBulkEmployeeTest = () => {
    try {
      const employees = JSON.parse(bulkEmployees)
      runTest("bulk_employees", employees)
    } catch (error) {
      alert("Invalid JSON format in bulk employees")
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-emerald-600 animate-pulse" />
    ) : (
      <XCircle className="h-5 w-5 text-rose-600 animate-bounce" />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg animate-pulse">
        Success
      </Badge>
    ) : (
      <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg animate-bounce">Failed</Badge>
    )
  }

  const getMatchStatusBadge = (status: string) => {
    const badges = {
      exact: (
        <Badge className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white shadow-lg transform hover:scale-105 transition-all duration-300 animate-pulse">
          ✨ Exact Match
        </Badge>
      ),
      partial: (
        <Badge className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
          ⚡ Partial Match
        </Badge>
      ),
      invalid: (
        <Badge className="bg-gradient-to-r from-rose-400 via-red-500 to-pink-500 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
          ❌ No Match
        </Badge>
      ),
    }
    return badges[status as keyof typeof badges] || null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4 hover:bg-white/50 transition-all duration-300 transform hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 animate-gradient">
              Apollo API Testing Suite
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive testing for Apollo API integration, data validation, and real-time performance monitoring
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Connection Test */}
          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-slide-up">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-bold">Connection Test</div>
                  <div className="text-blue-100 text-sm">API Connectivity & Auth</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-600 mb-6">Test basic Apollo API connectivity and authentication status</p>
              <Button
                onClick={() => runTest("connection")}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Zap className="h-5 w-5 mr-2" />}
                Test Connection
              </Button>
            </CardContent>
          </Card>

          {/* All Endpoints Test */}
          <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-slide-up animation-delay-100">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-bold">Full API Suite</div>
                  <div className="text-purple-100 text-sm">All Endpoints Test</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-600 mb-6">Comprehensive testing of all Apollo API endpoints and features</p>
              <Button
                onClick={() => runTest("api_endpoints")}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Target className="h-5 w-5 mr-2" />}
                Test All Endpoints
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Single Employee Test */}
        <Card className="mb-6 bg-gradient-to-br from-white to-emerald-50 border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-500 animate-slide-up animation-delay-200">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold">Single Employee Test</div>
                <div className="text-emerald-100 text-sm">Individual Data Validation</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={singleEmployee.name}
                  onChange={(e) => setSingleEmployee({ ...singleEmployee, name: e.target.value })}
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={singleEmployee.email}
                  onChange={(e) => setSingleEmployee({ ...singleEmployee, email: e.target.value })}
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-slate-700 font-medium">
                  Company Name
                </Label>
                <Input
                  id="company"
                  value={singleEmployee.company}
                  onChange={(e) => setSingleEmployee({ ...singleEmployee, company: e.target.value })}
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className="text-slate-700 font-medium">
                  Job Position
                </Label>
                <Input
                  id="position"
                  value={singleEmployee.position}
                  onChange={(e) => setSingleEmployee({ ...singleEmployee, position: e.target.value })}
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 transition-all duration-300"
                />
              </div>
            </div>
            <Button
              onClick={runSingleEmployeeTest}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Search className="h-5 w-5 mr-2" />}
              Validate Employee Data
            </Button>
          </CardContent>
        </Card>

        {/* Bulk Employee Test */}
        <Card className="mb-8 bg-gradient-to-br from-white to-orange-50 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-500 animate-slide-up animation-delay-300">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold">Bulk Employee Test</div>
                <div className="text-orange-100 text-sm">Batch Processing & Analytics</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Label htmlFor="bulk-employees" className="text-slate-700 font-medium mb-3 block">
              Employee Data (JSON Format)
            </Label>
            <Textarea
              id="bulk-employees"
              value={bulkEmployees}
              onChange={(e) => setBulkEmployees(e.target.value)}
              rows={10}
              className="mb-6 font-mono text-sm border-orange-200 focus:border-orange-400 focus:ring-orange-400 transition-all duration-300"
            />
            <Button
              onClick={runBulkEmployeeTest}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Database className="h-5 w-5 mr-2" />}
              Process Bulk Data
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-xl animate-slide-up animation-delay-400">
          <CardHeader className="bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold">Test Results</div>
                <div className="text-slate-200 text-sm">{testResults.length} Tests Completed</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {testResults.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="relative">
                  <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-6 animate-pulse" />
                  <div className="absolute inset-0 h-16 w-16 mx-auto animate-ping">
                    <AlertCircle className="h-16 w-16 text-slate-200" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Ready for Testing</h3>
                <p className="text-slate-600">Run a test above to see detailed results and analytics here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-xl p-6 bg-gradient-to-br from-white to-slate-50 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(result.success)}
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 capitalize">
                            {result.testType.replace("_", " ")} Test
                          </h3>
                          <p className="text-slate-600 text-sm">{new Date(result.timestamp).toLocaleString()}</p>
                        </div>
                        {getStatusBadge(result.success)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono">{result.responseTime || "N/A"}</span>
                      </div>
                    </div>

                    {result.error && (
                      <Alert className="mb-4 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 animate-shake">
                        <AlertCircle className="h-5 w-5 text-rose-600" />
                        <AlertDescription className="text-rose-800 font-medium">{result.error}</AlertDescription>
                      </Alert>
                    )}

                    {result.message && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 font-medium">{result.message}</p>
                      </div>
                    )}

                    {/* Connection Test Results */}
                    {result.testType === "connection" && result.details && (
                      <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-lg p-4 border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-600" />
                          Connection Details
                        </h4>
                        <pre className="text-sm overflow-x-auto bg-slate-800 text-green-400 p-4 rounded-lg font-mono">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Single Employee Results */}
                    {result.testType === "single_employee" && result.output && (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-5 border border-blue-200">
                            <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Input Data
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-blue-700">Name:</span>
                                <span className="text-blue-900">{result.input?.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-blue-700">Email:</span>
                                <span className="text-blue-900">{result.input?.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-blue-700">Company:</span>
                                <span className="text-blue-900">{result.input?.company}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-blue-700">Position:</span>
                                <span className="text-blue-900">{result.input?.position}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl p-5 border border-emerald-200">
                            <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                              <Database className="h-5 w-5" />
                              Apollo Response
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-emerald-700">Status:</span>
                                {getMatchStatusBadge(result.output.status)}
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-emerald-700">API Data:</span>
                                <Badge
                                  className={
                                    result.output.apolloData ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                                  }
                                >
                                  {result.output.apolloData ? "Found" : "Not Found"}
                                </Badge>
                              </div>
                              {result.output.apolloData && (
                                <>
                                  <div className="pt-2 border-t border-emerald-200">
                                    <div className="flex justify-between">
                                      <span className="font-medium text-emerald-700">Name:</span>
                                      <span className="text-emerald-900">{result.output.apolloData.verifiedName}</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium text-emerald-700">Email:</span>
                                    <span className="text-emerald-900">{result.output.apolloData.verifiedEmail}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium text-emerald-700">Company:</span>
                                    <span className="text-emerald-900">{result.output.apolloData.verifiedCompany}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium text-emerald-700">Position:</span>
                                    <span className="text-emerald-900">
                                      {result.output.apolloData.verifiedPosition}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bulk Employee Results */}
                    {result.testType === "bulk_employees" && result.stats && (
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-5 border border-orange-200">
                        <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Bulk Processing Analytics
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[
                            { label: "Total", value: result.stats.total, color: "bg-slate-500", icon: "📊" },
                            { label: "Exact", value: result.stats.exact, color: "bg-emerald-500", icon: "✨" },
                            { label: "Partial", value: result.stats.partial, color: "bg-amber-500", icon: "⚡" },
                            { label: "Invalid", value: result.stats.invalid, color: "bg-rose-500", icon: "❌" },
                            {
                              label: "With Data",
                              value: result.stats.withApolloData,
                              color: "bg-blue-500",
                              icon: "🔍",
                            },
                          ].map((stat, idx) => (
                            <div
                              key={stat.label}
                              className="text-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                            >
                              <div className="text-2xl mb-1">{stat.icon}</div>
                              <div className={`text-2xl font-bold text-white ${stat.color} rounded-lg py-2 mb-2`}>
                                {stat.value}
                              </div>
                              <div className="text-sm font-medium text-slate-600">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Endpoints Results */}
                    {result.testType === "api_endpoints" && result.summary && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Endpoint Test Summary
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(result.summary).map(([endpoint, success]) => (
                            <div
                              key={endpoint}
                              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                                success
                                  ? "bg-emerald-100 border border-emerald-300"
                                  : "bg-rose-100 border border-rose-300"
                              }`}
                            >
                              {success ? (
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-rose-600" />
                              )}
                              <span
                                className={`font-medium capitalize ${success ? "text-emerald-800" : "text-rose-800"}`}
                              >
                                {endpoint.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                            </div>
                          ))}
                        </div>
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
