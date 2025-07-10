import { type NextRequest, NextResponse } from "next/server"
import { employeeStorage } from "../../upload/route"
import { apolloService, type EnrichedEmployee } from "@/lib/apollo-service"

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ success: false, error: "File ID is required" }, { status: 400 })
    }

    const data = employeeStorage.get(fileId)

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "File not found. Please upload your file again.",
        },
        { status: 404 },
      )
    }

    // Test Apollo connection (will automatically fall back to mock mode if needed)
    const connectionTest = await apolloService.testConnection()
    console.log("Apollo connection test result:", connectionTest)

    // Mark analysis as started
    data.status = "analyzing"
    data.analysisStartedAt = new Date().toISOString()
    employeeStorage.set(fileId, data)

    // Start background analysis process
    processEmployeesWithApollo(fileId, data.employees)

    return NextResponse.json({
      success: true,
      message: "Analysis started successfully",
      apolloConnection: connectionTest.success ? connectionTest.message : "Using mock data",
      mode: connectionTest.details?.mode || "unknown",
    })
  } catch (error) {
    console.error("Analysis start error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to start analysis: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

// Background process to analyze employees with Apollo API or mock data
async function processEmployeesWithApollo(fileId: string, employees: any[]) {
  try {
    console.log(`Starting analysis for ${employees.length} employees`)

    // Process employees in smaller batches
    const enrichedEmployees: EnrichedEmployee[] = []
    const batchSize = 5 // Process 5 employees at a time

    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(employees.length / batchSize)}`)

      try {
        const batchResults = await apolloService.bulkEnrichEmployees(batch)
        enrichedEmployees.push(...batchResults)

        // Update storage with progress
        const data = employeeStorage.get(fileId)
        if (data) {
          // Update the processed employees
          for (let j = 0; j < batchResults.length; j++) {
            const originalIndex = i + j
            if (originalIndex < employees.length) {
              employees[originalIndex] = batchResults[j]
            }
          }

          data.employees = employees
          data.lastProcessedBatch = Math.floor(i / batchSize) + 1
          data.totalBatches = Math.ceil(employees.length / batchSize)
          employeeStorage.set(fileId, data)
        }

        console.log(`Completed batch ${Math.floor(i / batchSize) + 1}, processed ${enrichedEmployees.length} employees`)

        // Log match statistics for this batch
        const batchStats = {
          total: batchResults.length,
          exact: batchResults.filter((r) => r.status === "exact").length,
          partial: batchResults.filter((r) => r.status === "partial").length,
          invalid: batchResults.filter((r) => r.status === "invalid").length,
        }
        console.log(
          `Batch results: ${batchStats.exact} exact, ${batchStats.partial} partial, ${batchStats.invalid} invalid`,
        )
      } catch (batchError) {
        console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, batchError)

        // Mark batch employees as invalid
        for (let j = 0; j < batch.length; j++) {
          const originalIndex = i + j
          if (originalIndex < employees.length) {
            employees[originalIndex] = {
              ...batch[j],
              status: "invalid",
              error: "Processing failed",
              processedAt: new Date().toISOString(),
            }
          }
        }
      }

      // Add small delay between batches
      if (i + batchSize < employees.length) {
        console.log("Waiting 1 second before next batch...")
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // Mark analysis as complete
    const data = employeeStorage.get(fileId)
    if (data) {
      data.status = "completed"
      data.analysisCompletedAt = new Date().toISOString()

      // Calculate final statistics
      const stats = {
        total: employees.length,
        exact: employees.filter((emp: any) => emp.status === "exact").length,
        partial: employees.filter((emp: any) => emp.status === "partial").length,
        invalid: employees.filter((emp: any) => emp.status === "invalid").length,
      }

      data.finalStats = stats
      employeeStorage.set(fileId, data)

      console.log(`Analysis completed for file ${fileId}:`, stats)
    }
  } catch (error) {
    console.error(`Fatal error in analysis for file ${fileId}:`, error)

    // Mark analysis as failed
    const data = employeeStorage.get(fileId)
    if (data) {
      data.status = "failed"
      data.analysisCompletedAt = new Date().toISOString()
      data.error = error instanceof Error ? error.message : "Unknown error"
      employeeStorage.set(fileId, data)
    }
  }
}
