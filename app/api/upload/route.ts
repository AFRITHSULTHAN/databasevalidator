import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

// In-memory storage for uploaded files and employee data
const employeeStorage = new Map()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validExtensions = [".xlsx", ".xls", ".csv"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Please upload Excel (.xlsx, .xls) or CSV files only.",
        },
        { status: 400 },
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "File size too large. Maximum size is 10MB.",
        },
        { status: 400 },
      )
    }

    // Generate unique file ID
    const fileId = Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9)

    // Read file content
    const arrayBuffer = await file.arrayBuffer()

    // Parse the file and extract employee data
    const employees = await parseEmployeeFile(arrayBuffer, file.name, fileId)

    if (employees.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid employee data found. Please check your file format and required columns.",
        },
        { status: 400 },
      )
    }

    // Store employee data in memory
    employeeStorage.set(fileId, {
      employees,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      status: "uploaded",
    })

    return NextResponse.json({
      success: true,
      fileId,
      employeeCount: employees.length,
      message: `Successfully parsed ${employees.length} employee records`,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Upload failed: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

// Parse Excel/CSV file and extract employee data
async function parseEmployeeFile(buffer: ArrayBuffer, originalName: string, fileId: string) {
  try {
    console.log(`📁 Parsing file: ${originalName}`)
    const employees = []

    if (originalName.toLowerCase().endsWith(".csv")) {
      // Parse CSV file
      const decoder = new TextDecoder("utf-8")
      const csvContent = decoder.decode(buffer)
      const lines = csvContent.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("CSV file must contain at least a header row and one data row")
      }

      // Parse headers - handle different CSV formats
      const headerLine = lines[0]
      let headers: string[]

      // Try different delimiters
      if (headerLine.includes(",")) {
        headers = headerLine.split(",")
      } else if (headerLine.includes(";")) {
        headers = headerLine.split(";")
      } else if (headerLine.includes("\t")) {
        headers = headerLine.split("\t")
      } else {
        headers = [headerLine] // Single column
      }

      // Clean headers
      headers = headers.map((h) => h.trim().toLowerCase().replace(/['"]/g, ""))

      console.log("📋 CSV Headers found:", headers)

      // Find column indices with improved matching
      const nameIndex = findColumnIndex(headers, [
        "name",
        "full name",
        "employee name",
        "first name",
        "fname",
        "full_name",
        "employee_name",
        "first_name",
        "nome",
        "nom",
        "nombre",
        "имя",
        "نام", // Multi-language support
      ])
      const emailIndex = findColumnIndex(headers, [
        "email",
        "email address",
        "e-mail",
        "work email",
        "mail",
        "e_mail",
        "email_address",
        "work_email",
        "correo",
        "courriel",
        "почта",
        "ایمیل",
      ])
      const companyIndex = findColumnIndex(headers, [
        "company",
        "organization",
        "employer",
        "company name",
        "org",
        "company_name",
        "organization_name",
        "empresa",
        "entreprise",
        "компания",
        "شرکت",
      ])
      const positionIndex = findColumnIndex(headers, [
        "position",
        "title",
        "job title",
        "role",
        "designation",
        "job",
        "job_title",
        "position_title",
        "cargo",
        "poste",
        "должность",
        "موقعیت",
      ])
      const contactIndex = findColumnIndex(headers, [
        "contact",
        "phone",
        "mobile",
        "telephone",
        "cell",
        "phone_number",
        "contact_number",
      ])

      console.log("🔍 Column indices found:", {
        name: nameIndex,
        email: emailIndex,
        company: companyIndex,
        position: positionIndex,
        contact: contactIndex,
      })

      // More flexible validation - only require name and email as absolute minimum
      if (nameIndex === -1 || emailIndex === -1) {
        throw new Error(
          `Missing essential columns. Found headers: ${headers.join(", ")}. Please ensure your CSV has at least Name and Email columns.`,
        )
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue // Skip empty lines

        let row: string[]

        // Use same delimiter as headers
        if (headerLine.includes(",")) {
          row = line.split(",")
        } else if (headerLine.includes(";")) {
          row = line.split(";")
        } else if (headerLine.includes("\t")) {
          row = line.split("\t")
        } else {
          row = [line]
        }

        // Clean row data
        row = row.map((cell) => cell.trim().replace(/^["']|["']$/g, ""))

        // Validate essential data
        const name = row[nameIndex]?.trim()
        const email = row[emailIndex]?.trim()

        if (name && email && email.includes("@")) {
          employees.push({
            id: `emp_${fileId}_${i}`,
            name: name,
            email: email,
            company: companyIndex >= 0 && row[companyIndex] ? row[companyIndex].trim() : "Unknown Company",
            position: positionIndex >= 0 && row[positionIndex] ? row[positionIndex].trim() : "Unknown Position",
            contact: contactIndex >= 0 && row[contactIndex] ? row[contactIndex].trim() : undefined,
            status: "pending",
          })
        }
      }
    } else {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      if (jsonData.length < 2) {
        throw new Error("Excel file must contain at least a header row and one data row")
      }

      // Get headers and clean them
      const rawHeaders = jsonData[0] || []
      const headers = rawHeaders.map((h) => (h?.toString() || "").toLowerCase().trim())

      console.log("📋 Excel Headers found:", headers)

      // Find column indices with improved matching
      const nameIndex = findColumnIndex(headers, [
        "name",
        "full name",
        "employee name",
        "first name",
        "fname",
        "full_name",
        "employee_name",
        "first_name",
        "nome",
        "nom",
        "nombre",
        "имя",
        "نام",
      ])
      const emailIndex = findColumnIndex(headers, [
        "email",
        "email address",
        "e-mail",
        "work email",
        "mail",
        "e_mail",
        "email_address",
        "work_email",
        "correo",
        "courriel",
        "почта",
        "ایمیل",
      ])
      const companyIndex = findColumnIndex(headers, [
        "company",
        "organization",
        "employer",
        "company name",
        "org",
        "company_name",
        "organization_name",
        "empresa",
        "entreprise",
        "компания",
        "شرکت",
      ])
      const positionIndex = findColumnIndex(headers, [
        "position",
        "title",
        "job title",
        "role",
        "designation",
        "job",
        "job_title",
        "position_title",
        "cargo",
        "poste",
        "должность",
        "موقعیت",
      ])
      const contactIndex = findColumnIndex(headers, [
        "contact",
        "phone",
        "mobile",
        "telephone",
        "cell",
        "phone_number",
        "contact_number",
      ])

      console.log("🔍 Column indices found:", {
        name: nameIndex,
        email: emailIndex,
        company: companyIndex,
        position: positionIndex,
        contact: contactIndex,
      })

      // More flexible validation - only require name and email as absolute minimum
      if (nameIndex === -1 || emailIndex === -1) {
        throw new Error(
          `Missing essential columns. Found headers: ${headers.join(", ")}. Please ensure your Excel file has at least Name and Email columns.`,
        )
      }

      // Parse data rows
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length === 0) continue // Skip empty rows

        // Validate essential data
        const name = row[nameIndex]?.toString().trim()
        const email = row[emailIndex]?.toString().trim()

        if (name && email && email.includes("@")) {
          employees.push({
            id: `emp_${fileId}_${i}`,
            name: name,
            email: email,
            company: companyIndex >= 0 && row[companyIndex] ? row[companyIndex].toString().trim() : "Unknown Company",
            position:
              positionIndex >= 0 && row[positionIndex] ? row[positionIndex].toString().trim() : "Unknown Position",
            contact: contactIndex >= 0 && row[contactIndex] ? row[contactIndex].toString().trim() : undefined,
            status: "pending",
          })
        }
      }
    }

    console.log(`✅ Successfully parsed ${employees.length} employees from ${originalName}`)
    return employees
  } catch (error) {
    console.error("Parse error:", error)
    throw new Error("Failed to parse employee file: " + (error instanceof Error ? error.message : "Unknown error"))
  }
}

// Helper function to find column index by possible names - IMPROVED
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  console.log(`🔍 Looking for columns matching: ${possibleNames.join(", ")}`)
  console.log(`📋 Available headers: ${headers.join(", ")}`)

  // First try exact matches
  for (const name of possibleNames) {
    const exactIndex = headers.findIndex((h) => h === name)
    if (exactIndex >= 0) {
      console.log(`✅ Found exact match: "${name}" at index ${exactIndex}`)
      return exactIndex
    }
  }

  // Then try partial matches (contains)
  for (const name of possibleNames) {
    const partialIndex = headers.findIndex((h) => h.includes(name) || name.includes(h))
    if (partialIndex >= 0) {
      console.log(`✅ Found partial match: "${name}" in "${headers[partialIndex]}" at index ${partialIndex}`)
      return partialIndex
    }
  }

  // Finally try fuzzy matching (remove spaces, underscores, etc.)
  for (const name of possibleNames) {
    const normalizedName = name.replace(/[\s_-]/g, "").toLowerCase()
    const fuzzyIndex = headers.findIndex((h) => {
      const normalizedHeader = h.replace(/[\s_-]/g, "").toLowerCase()
      return normalizedHeader.includes(normalizedName) || normalizedName.includes(normalizedHeader)
    })
    if (fuzzyIndex >= 0) {
      console.log(`✅ Found fuzzy match: "${name}" ~ "${headers[fuzzyIndex]}" at index ${fuzzyIndex}`)
      return fuzzyIndex
    }
  }

  console.log(`❌ No match found for: ${possibleNames.join(", ")}`)
  return -1
}

// Export the storage for other API routes to access
export { employeeStorage }
