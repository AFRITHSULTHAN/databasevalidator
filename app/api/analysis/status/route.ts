import { type NextRequest, NextResponse } from "next/server"
import { employeeStorage } from "../../upload/route"

export async function GET(request: NextRequest) {
  try {
    const fileId = request.nextUrl.searchParams.get("fileId")

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

    const employees = data.employees
    const processedCount = employees.filter((emp: any) => emp.status !== "pending").length
    const progress = Math.round((processedCount / employees.length) * 100)

    // Calculate statistics
    const stats = {
      total: employees.length,
      processed: processedCount,
      pending: employees.filter((emp: any) => emp.status === "pending").length,
      exact: employees.filter((emp: any) => emp.status === "exact").length,
      partial: employees.filter((emp: any) => emp.status === "partial").length,
      invalid: employees.filter((emp: any) => emp.status === "invalid").length,
    }

    return NextResponse.json({
      success: true,
      progress,
      employees,
      stats,
      status: data.status,
      analysisStartedAt: data.analysisStartedAt,
      analysisCompletedAt: data.analysisCompletedAt,
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get analysis status",
      },
      { status: 500 },
    )
  }
}
