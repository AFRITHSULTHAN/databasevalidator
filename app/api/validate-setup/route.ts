import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const validationResults = {
      apiKey: {
        configured: !!process.env.APOLLO_API_KEY,
        status: process.env.APOLLO_API_KEY ? "present" : "missing",
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        apolloUrl: process.env.APOLLO_API_URL || "https://api.apollo.io/v1",
      },
      fileUpload: {
        maxSize: process.env.MAX_FILE_SIZE || "10485760",
        allowedTypes: process.env.ALLOWED_FILE_TYPES || ".xlsx,.xls,.csv",
      },
      rateLimiting: {
        limit: process.env.APOLLO_API_RATE_LIMIT || "100",
      },
    }

    const isFullyConfigured = validationResults.apiKey.configured

    return NextResponse.json({
      success: true,
      configured: isFullyConfigured,
      results: validationResults,
      recommendations: isFullyConfigured
        ? []
        : [
            "Add APOLLO_API_KEY to your environment variables",
            "Restart the development server after adding the API key",
            "Test the connection using the API Status indicator",
          ],
    })
  } catch (error) {
    console.error("Setup validation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate setup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
