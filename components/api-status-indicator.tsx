"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApiStatus {
  success: boolean
  message: string
  apiKeyStatus?: string
  connectionStatus?: string
  details?: any
  error?: string
  status?: string
}

export function ApiStatusIndicator() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-connection")
      const result = await response.json()
      setApiStatus(result)
    } catch (error) {
      setApiStatus({
        success: false,
        error: "Failed to test connection",
        status: "network_error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Test connection on component mount
    testConnection()
  }, [])

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
    if (!apiStatus) return <AlertCircle className="h-4 w-4 text-gray-400" />
    if (apiStatus.success) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = () => {
    if (isLoading) return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>
    if (!apiStatus) return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    if (apiStatus.success) return <Badge className="bg-green-100 text-green-800">Connected</Badge>

    switch (apiStatus.status) {
      case "missing_key":
        return <Badge className="bg-yellow-100 text-yellow-800">API Key Missing</Badge>
      case "connection_failed":
        return <Badge className="bg-red-100 text-red-800">Connection Failed</Badge>
      default:
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          API Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {getStatusBadge()}
          </div>
          <Button variant="outline" size="sm" onClick={testConnection} disabled={isLoading}>
            {isLoading ? "Testing..." : "Test Connection"}
          </Button>
        </div>

        {apiStatus && (
          <div className="space-y-3">
            {apiStatus.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {apiStatus.message}
                  {apiStatus.details?.environment === "development" && (
                    <span className="block text-sm mt-1">Running in development mode with mock API responses</span>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="font-medium">{apiStatus.error}</div>
                  {apiStatus.details && <div className="text-sm mt-1">{apiStatus.details}</div>}
                  {apiStatus.status === "missing_key" && (
                    <div className="text-sm mt-2">
                      <strong>Setup Instructions:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Get your Apollo API key from apollo.io</li>
                        <li>Add APOLLO_API_KEY to your .env.local file</li>
                        <li>Restart the development server</li>
                      </ol>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {apiStatus.success && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">API Key:</span>
                  <span className="ml-2 text-green-600">Configured</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Connection:</span>
                  <span className="ml-2 text-green-600">Active</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
