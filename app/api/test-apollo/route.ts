import { type NextRequest, NextResponse } from "next/server"
import { apolloService } from "@/lib/apollo-service"

export async function POST(request: NextRequest) {
  try {
    const { testType, testData } = await request.json()

    console.log(`Starting Apollo API test: ${testType}`)

    switch (testType) {
      case "connection":
        return await testConnection()

      case "single_employee":
        return await testSingleEmployee(testData)

      case "bulk_employees":
        return await testBulkEmployees(testData)

      case "api_endpoints":
        return await testAllEndpoints()

      default:
        return NextResponse.json({ success: false, error: "Invalid test type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Apollo API test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function testConnection() {
  console.log("Testing Apollo API connection...")

  const startTime = Date.now()
  const result = await apolloService.testConnection()
  const responseTime = Date.now() - startTime

  return NextResponse.json({
    success: result.success,
    testType: "connection",
    message: result.message,
    responseTime: `${responseTime}ms`,
    details: result.details,
    timestamp: new Date().toISOString(),
  })
}

async function testSingleEmployee(employee: any) {
  console.log("Testing single employee enrichment:", employee)

  const startTime = Date.now()

  try {
    const result = await apolloService.enrichEmployee({
      id: "test-1",
      name: employee.name || "John Doe",
      email: employee.email || "john.doe@example.com",
      company: employee.company || "Example Corp",
      position: employee.position || "Software Engineer",
    })

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      testType: "single_employee",
      input: employee,
      output: result,
      responseTime: `${responseTime}ms`,
      apiDataFound: !!result.apolloData,
      matchStatus: result.status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: false,
      testType: "single_employee",
      input: employee,
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    })
  }
}

async function testBulkEmployees(employees: any[]) {
  console.log("Testing bulk employee enrichment:", employees.length, "employees")

  const startTime = Date.now()

  try {
    const testEmployees = employees.map((emp, index) => ({
      id: `test-${index + 1}`,
      name: emp.name || `Test User ${index + 1}`,
      email: emp.email || `test${index + 1}@example.com`,
      company: emp.company || "Test Company",
      position: emp.position || "Test Position",
    }))

    const results = await apolloService.bulkEnrichEmployees(testEmployees)
    const responseTime = Date.now() - startTime

    const stats = {
      total: results.length,
      exact: results.filter((r) => r.status === "exact").length,
      partial: results.filter((r) => r.status === "partial").length,
      invalid: results.filter((r) => r.status === "invalid").length,
      withApolloData: results.filter((r) => !!r.apolloData).length,
    }

    return NextResponse.json({
      success: true,
      testType: "bulk_employees",
      input: testEmployees,
      output: results,
      stats,
      responseTime: `${responseTime}ms`,
      averageTimePerEmployee: `${Math.round(responseTime / results.length)}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: false,
      testType: "bulk_employees",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    })
  }
}

async function testAllEndpoints() {
  console.log("Testing all Apollo API endpoints...")

  const results = {
    connection: null as any,
    emailEnrichment: null as any,
    nameEnrichment: null as any,
    bulkEnrichment: null as any,
    peopleSearch: null as any,
  }

  const startTime = Date.now()

  try {
    // Test 1: Connection
    console.log("Testing connection...")
    results.connection = await apolloService.testConnection()

    // Test 2: Email enrichment
    console.log("Testing email enrichment...")
    try {
      const emailResult = await apolloService.enrichEmployee({
        id: "test-email",
        name: "Test User",
        email: "test@example.com",
        company: "Example Corp",
        position: "Software Engineer",
      })
      results.emailEnrichment = {
        success: true,
        result: emailResult,
        hasApolloData: !!emailResult.apolloData,
      }
    } catch (error) {
      results.emailEnrichment = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 3: Name + domain enrichment
    console.log("Testing name enrichment...")
    try {
      const nameResult = await apolloService.enrichEmployee({
        id: "test-name",
        name: "Jane Smith",
        email: "jane.smith@testcompany.com",
        company: "Test Company",
        position: "Product Manager",
      })
      results.nameEnrichment = {
        success: true,
        result: nameResult,
        hasApolloData: !!nameResult.apolloData,
      }
    } catch (error) {
      results.nameEnrichment = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 4: Bulk enrichment
    console.log("Testing bulk enrichment...")
    try {
      const bulkResult = await apolloService.bulkEnrichEmployees([
        {
          id: "bulk-1",
          name: "Alice Johnson",
          email: "alice@company.com",
          company: "Company Inc",
          position: "Designer",
        },
        {
          id: "bulk-2",
          name: "Bob Wilson",
          email: "bob@startup.io",
          company: "Startup",
          position: "Developer",
        },
      ])
      results.bulkEnrichment = {
        success: true,
        result: bulkResult,
        count: bulkResult.length,
        withData: bulkResult.filter((r) => !!r.apolloData).length,
      }
    } catch (error) {
      results.bulkEnrichment = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 5: People search
    console.log("Testing people search...")
    try {
      const searchResult = await apolloService.searchPeopleByCompany("example.com", ["Manager"])
      results.peopleSearch = {
        success: true,
        result: searchResult,
        count: searchResult.length,
      }
    } catch (error) {
      results.peopleSearch = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    const totalTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      testType: "all_endpoints",
      results,
      totalTime: `${totalTime}ms`,
      summary: {
        connection: results.connection?.success || false,
        emailEnrichment: results.emailEnrichment?.success || false,
        nameEnrichment: results.nameEnrichment?.success || false,
        bulkEnrichment: results.bulkEnrichment?.success || false,
        peopleSearch: results.peopleSearch?.success || false,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const totalTime = Date.now() - startTime

    return NextResponse.json({
      success: false,
      testType: "all_endpoints",
      error: error instanceof Error ? error.message : "Unknown error",
      results,
      totalTime: `${totalTime}ms`,
      timestamp: new Date().toISOString(),
    })
  }
}
