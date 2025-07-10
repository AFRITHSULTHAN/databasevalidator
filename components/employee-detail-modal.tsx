"use client"

import { X, ExternalLink, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
    seniority?: string
    department?: string
    linkedinVerified: boolean
  }
}

interface EmployeeDetailModalProps {
  employee: Employee
  onClose: () => void
}

export function EmployeeDetailModal({ employee, onClose }: EmployeeDetailModalProps) {
  const getMatchIcon = (original: string, verified: string) => {
    const isMatch = original.toLowerCase().trim() === verified.toLowerCase().trim()
    return isMatch ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }

  const getMatchStatus = (original: string, verified: string) => {
    const isMatch = original.toLowerCase().trim() === verified.toLowerCase().trim()
    return isMatch ? "Match" : "Different"
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <ExternalLink className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold">Employee Details: {employee.name}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original Data */}
            <Card>
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

            {/* LinkedIn & Apollo Data */}
            <Card>
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
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Validation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getMatchIcon(employee.name, employee.apolloData.verifiedName)}
                      <span className="font-medium">Name</span>
                    </div>
                    <Badge
                      variant={
                        getMatchStatus(employee.name, employee.apolloData.verifiedName) === "Match"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {getMatchStatus(employee.name, employee.apolloData.verifiedName)}
                    </Badge>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getMatchIcon(employee.email, employee.apolloData.verifiedEmail)}
                      <span className="font-medium">Email</span>
                    </div>
                    <Badge
                      variant={
                        getMatchStatus(employee.email, employee.apolloData.verifiedEmail) === "Match"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {getMatchStatus(employee.email, employee.apolloData.verifiedEmail)}
                    </Badge>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getMatchIcon(employee.company, employee.apolloData.verifiedCompany)}
                      <span className="font-medium">Company</span>
                    </div>
                    <Badge
                      variant={
                        getMatchStatus(employee.company, employee.apolloData.verifiedCompany) === "Match"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {getMatchStatus(employee.company, employee.apolloData.verifiedCompany)}
                    </Badge>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getMatchIcon(employee.position, employee.apolloData.verifiedPosition)}
                      <span className="font-medium">Position</span>
                    </div>
                    <Badge
                      variant={
                        getMatchStatus(employee.position, employee.apolloData.verifiedPosition) === "Match"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {getMatchStatus(employee.position, employee.apolloData.verifiedPosition)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
