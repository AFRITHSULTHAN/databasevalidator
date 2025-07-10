"use server"

import { writeFile, readFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import * as XLSX from "xlsx"

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

// File upload action
export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique file ID
    const fileId = Date.now().toString()
    const fileName = `${fileId}_${file.name}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Parse the file and extract employee data
    const employees = await parseEmployeeFile(filePath, file.name)

    // Save employee data
    const dataPath = path.join(uploadsDir, `${fileId}_data.json`)
    await writeFile(dataPath, JSON.stringify({ employees, fileName: file.name }))

    return { success: true, fileId, employeeCount: employees.length }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: "Upload failed" }
  }
}

// Parse Excel/CSV file and extract employee data
async function parseEmployeeFile(filePath: string, originalName: string): Promise<Employee[]> {
  try {
    const employees: Employee[] = []

    if (originalName.toLowerCase().endsWith(".csv")) {
      // Parse CSV file
      const fileContent = await readFile(filePath, "utf-8")
      const lines = fileContent.split("\n")
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

      // Find column indices
      const nameIndex = findColumnIndex(headers, ["name", "full name", "employee name"])
      const emailIndex = findColumnIndex(headers, ["email", "email address", "e-mail"])
      const companyIndex = findColumnIndex(headers, ["company", "organization", "employer"])
      const positionIndex = findColumnIndex(headers, ["position", "title", "job title", "role"])
      const contactIndex = findColumnIndex(headers, ["contact", "phone", "mobile", "telephone"])

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map((cell) => cell.trim())
        if (row.length > 1 && row[nameIndex] && row[emailIndex]) {
          employees.push({
            id: `emp_${i}`,
            name: row[nameIndex] || "",
            email: row[emailIndex] || "",
            company: row[companyIndex] || "",
            position: row[positionIndex] || "",
            contact: contactIndex >= 0 ? row[contactIndex] : undefined,
            status: "pending",
          })
        }
      }
    } else {
      // Parse Excel file
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

      if (jsonData.length < 2) {
        throw new Error("File must contain at least a header row and one data row")
      }

      const headers = jsonData[0].map((h) => h?.toString().toLowerCase() || "")

      // Find column indices
      const nameIndex = findColumnIndex(headers, ["name", "full name", "employee name"])
      const emailIndex = findColumnIndex(headers, ["email", "email address", "e-mail"])
      const companyIndex = findColumnIndex(headers, ["company", "organization", "employer"])
      const positionIndex = findColumnIndex(headers, ["position", "title", "job title", "role"])
      const contactIndex = findColumnIndex(headers, ["contact", "phone", "mobile", "telephone"])

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (row && row.length > 1 && row[nameIndex] && row[emailIndex]) {
          employees.push({
            id: `emp_${i}`,
            name: row[nameIndex]?.toString() || "",
            email: row[emailIndex]?.toString() || "",
            company: row[companyIndex]?.toString() || "",
            position: row[positionIndex]?.toString() || "",
            contact: contactIndex >= 0 ? row[contactIndex]?.toString() : undefined,
            status: "pending",
          })
        }
      }
    }

    return employees
  } catch (error) {
    console.error("Parse error:", error)
    throw new Error("Failed to parse employee file")
  }
}

// Helper function to find column index by possible names
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex((h) => h.includes(name))
    if (index >= 0) return index
  }
  return -1
}

// Start analysis action
export async function startAnalysis(fileId: string) {
  try {
    const dataPath = path.join(process.cwd(), "uploads", `${fileId}_data.json`)
    const data = JSON.parse(await readFile(dataPath, "utf-8"))
    const employees: Employee[] = data.employees

    // Start background analysis process
    processEmployeesWithApollo(fileId, employees)

    return { success: true }
  } catch (error) {
    console.error("Analysis start error:", error)
    return { success: false, error: "Failed to start analysis" }
  }
}

// Background process to analyze employees with Apollo API
async function processEmployeesWithApollo(fileId: string, employees: Employee[]) {
  const dataPath = path.join(process.cwd(), "uploads", `${fileId}_data.json`)

  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i]

    try {
      // Simulate Apollo API call (replace with actual API integration)
      const apolloData = await mockApolloApiCall(employee)

      // Determine match status
      const matchCount = calculateMatchCount(employee, apolloData)
      let status: "exact" | "partial" | "invalid"

      if (matchCount >= 4) {
        status = "exact"
      } else if (matchCount >= 2) {
        status = "partial"
      } else {
        status = "invalid"
      }

      // Update employee data
      employees[i] = {
        ...employee,
        status,
        apolloData,
        linkedinUrl: apolloData
          ? `https://linkedin.com/in/${apolloData.verifiedName.toLowerCase().replace(" ", "-")}`
          : undefined,
      }

      // Save progress
      const updatedData = { employees, fileName: JSON.parse(await readFile(dataPath, "utf-8")).fileName }
      await writeFile(dataPath, JSON.stringify(updatedData))

      // Add delay to simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Error processing employee ${employee.id}:`, error)
      employees[i] = { ...employee, status: "invalid" }
    }
  }
}

// Mock Apollo API call (replace with actual Apollo API integration)
async function mockApolloApiCall(employee: Employee) {
  // This is a mock function - replace with actual Apollo API integration
  // For demonstration, we'll return mock data based on the employee info

  const mockResponses = [
    {
      verifiedName: employee.name,
      verifiedEmail: employee.email,
      verifiedCompany: employee.company,
      verifiedPosition: employee.position,
      seniority: "Mid-level",
      department: "Engineering",
      linkedinVerified: true,
    },
    {
      verifiedName: employee.name.split(" ").reverse().join(" "), // Different name order
      verifiedEmail: employee.email.replace("@", "+verified@"),
      verifiedCompany: employee.company + " Inc.",
      verifiedPosition: "Senior " + employee.position,
      seniority: "Senior",
      department: "Technology",
      linkedinVerified: true,
    },
    null, // No data found
  ]

  // Randomly return one of the mock responses
  const randomIndex = Math.floor(Math.random() * mockResponses.length)
  return mockResponses[randomIndex]
}

// Calculate match count between original and Apollo data
function calculateMatchCount(employee: Employee, apolloData: any): number {
  if (!apolloData) return 0

  let matches = 0

  if (employee.name.toLowerCase().trim() === apolloData.verifiedName.toLowerCase().trim()) matches++
  if (employee.email.toLowerCase().trim() === apolloData.verifiedEmail.toLowerCase().trim()) matches++
  if (employee.company.toLowerCase().trim() === apolloData.verifiedCompany.toLowerCase().trim()) matches++
  if (employee.position.toLowerCase().trim() === apolloData.verifiedPosition.toLowerCase().trim()) matches++

  return matches
}

// Get analysis status
export async function getAnalysisStatus(fileId: string) {
  try {
    const dataPath = path.join(process.cwd(), "uploads", `${fileId}_data.json`)
    const data = JSON.parse(await readFile(dataPath, "utf-8"))
    const employees: Employee[] = data.employees

    const processedCount = employees.filter((emp) => emp.status !== "pending").length
    const progress = Math.round((processedCount / employees.length) * 100)

    return { success: true, progress, employees }
  } catch (error) {
    console.error("Status check error:", error)
    return { success: false, error: "Failed to get analysis status" }
  }
}

// Download results
export async function downloadResults(fileId: string, type: "all" | "exact" | "partial" | "invalid") {
  try {
    const dataPath = path.join(process.cwd(), "uploads", `${fileId}_data.json`)
    const data = JSON.parse(await readFile(dataPath, "utf-8"))
    let employees: Employee[] = data.employees

    if (type !== "all") {
      employees = employees.filter((emp) => emp.status === type)
    }

    // Generate CSV content
    const csvHeaders = [
      "Name",
      "Email",
      "Company",
      "Position",
      "Status",
      "LinkedIn",
      "Apollo Name",
      "Apollo Email",
      "Apollo Company",
      "Apollo Position",
    ]
    const csvRows = employees.map((emp) => [
      emp.name,
      emp.email,
      emp.company,
      emp.position,
      emp.status,
      emp.linkedinUrl || "Not found",
      emp.apolloData?.verifiedName || "N/A",
      emp.apolloData?.verifiedEmail || "N/A",
      emp.apolloData?.verifiedCompany || "N/A",
      emp.apolloData?.verifiedPosition || "N/A",
    ])

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    return { success: true, csvData: csvContent }
  } catch (error) {
    console.error("Download error:", error)
    return { success: false, error: "Failed to generate download" }
  }
}

// This file is now replaced by API routes
// Keeping it empty to avoid errors in case it's referenced elsewhere
