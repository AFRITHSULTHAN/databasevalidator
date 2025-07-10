import { type NextRequest, NextResponse } from "next/server"
import { employeeStorage } from "../../upload/route"

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const fileId = params.fileId

    if (!fileId) {
      return NextResponse.json({ success: false, error: "File ID is required" }, { status: 400 })
    }

    // Get data from in-memory storage
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

    return NextResponse.json({
      success: true,
      employees: data.employees,
      fileName: data.fileName,
      uploadedAt: data.uploadedAt,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load employee data",
      },
      { status: 500 },
    )
  }
}
