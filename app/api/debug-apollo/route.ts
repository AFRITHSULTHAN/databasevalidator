import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      APOLLO_API_KEY: {
        exists: !!process.env.APOLLO_API_KEY,
        length: process.env.APOLLO_API_KEY?.length || 0,
        preview: process.env.APOLLO_API_KEY?.substring(0, 8) + "..." || "Not set",
      },
      APOLLO_API_URL: process.env.APOLLO_API_URL || "https://api.apollo.io",
      APOLLO_API_RATE_LIMIT: process.env.APOLLO_API_RATE_LIMIT || "100",
      NODE_ENV: process.env.NODE_ENV || "development",
    }

    // Check if we're in preview environment
    const isPreviewEnvironment =
      process.env.NODE_ENV === "development" || request.headers.get("host")?.includes("vusercontent.net")

    // Test actual Apollo API if not in preview
    let apolloApiTest = null
    if (!isPreviewEnvironment && process.env.APOLLO_API_KEY) {
      try {
        const testResponse = await fetch("https://api.apollo.io/api/v1/mixed_people/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": process.env.APOLLO_API_KEY,
          },
          body: JSON.stringify({
            per_page: 1,
          }),
        })

        apolloApiTest = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          success: testResponse.ok,
          headers: Object.fromEntries(testResponse.headers.entries()),
        }

        if (testResponse.ok) {
          const data = await testResponse.json()
          apolloApiTest.sampleResponse = data
        } else {
          apolloApiTest.errorText = await testResponse.text()
        }
      } catch (error) {
        apolloApiTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    return NextResponse.json({
      success: true,
      environment: {
        isPreviewEnvironment,
        host: request.headers.get("host"),
        userAgent: request.headers.get("user-agent"),
      },
      environmentVariables: envCheck,
      apolloApiTest,
      recommendations: [
        !envCheck.APOLLO_API_KEY.exists && "Set APOLLO_API_KEY environment variable",
        envCheck.APOLLO_API_KEY.length < 20 && "Apollo API key seems too short",
        isPreviewEnvironment && "Running in preview mode - using mock data",
        !apolloApiTest?.success && "Apollo API connection failed",
      ].filter(Boolean),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
