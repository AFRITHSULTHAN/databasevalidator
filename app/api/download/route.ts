import { type NextRequest, NextResponse } from "next/server"
import { employeeStorage } from "../upload/route"

export async function POST(request: NextRequest) {
  try {
    const { fileId, type } = await request.json()

    if (!fileId) {
      return NextResponse.json({ success: false, error: "File ID is required" }, { status: 400 })
    }

    if (!["all", "exact", "partial", "invalid"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid download type" }, { status: 400 })
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

    let employees = data.employees

    // Filter by type if not "all"
    if (type !== "all") {
      employees = employees.filter((emp: any) => emp.status === type)
    }

    if (employees.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No ${type === "all" ? "" : type + " "}records found to download`,
        },
        { status: 400 },
      )
    }

    // Generate comprehensive CSV content
    const csvHeaders = [
      "Name",
      "Email",
      "Company",
      "Position",
      "Contact",
      "Status",
      "LinkedIn URL",
      "Name in API",
      "Email in API",
      "Company in API",
      "Position in API",
      "LinkedIn Verified",
      "Processed At",
    ]

    const csvRows = employees.map((emp: any) => [
      emp.name || "",
      emp.email || "",
      emp.company || "",
      emp.position || "",
      emp.contact || "",
      emp.status || "",
      emp.linkedinUrl || "",
      emp.apolloData?.verifiedName || "",
      emp.apolloData?.verifiedEmail || "",
      emp.apolloData?.verifiedCompany || "",
      emp.apolloData?.verifiedPosition || "",
      emp.apolloData?.linkedinVerified ? "Yes" : "No",
      emp.processedAt || "",
    ])

    // Escape CSV values and join
    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    // Add BOM for proper Excel encoding
    const csvWithBOM = "\uFEFF" + csvContent

    return NextResponse.json({
      success: true,
      csvData: csvWithBOM,
      recordCount: employees.length,
      downloadType: type,
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate download",
      },
      { status: 500 },
    )
  }
}
