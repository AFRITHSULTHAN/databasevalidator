import { createApolloClient, type ApolloPersonResponse } from "./apollo-client"

interface Employee {
  id: string
  name: string
  email: string
  company: string
  position: string
  contact?: string
}

interface EnrichedEmployee extends Employee {
  status: "exact" | "partial" | "invalid"
  linkedinUrl?: string
  apolloData?: {
    verifiedName: string
    verifiedEmail: string
    verifiedCompany: string
    verifiedPosition: string
    linkedinVerified: boolean
    photoUrl?: string
    headline?: string
    location?: string
    phoneNumbers?: string[]
  }
  processedAt: string
  errorMessage?: string
}

class ApolloService {
  private client: any
  private isPreviewMode: boolean

  constructor() {
    // FIXED: Only use preview mode if API key is actually missing
    this.isPreviewMode = !process.env.APOLLO_API_KEY

    if (this.isPreviewMode) {
      console.log("⚠️  WARNING: No Apollo API key found - using mock data")
      console.log("Add APOLLO_API_KEY to .env.local to use real Apollo API")
      this.client = null
    } else {
      try {
        this.client = createApolloClient()
        console.log("✅ Apollo service initialized with REAL API client")
        console.log("🔑 Using API key:", process.env.APOLLO_API_KEY?.substring(0, 8) + "...")
      } catch (error) {
        console.error("❌ Failed to create Apollo client:", error)
        console.log("🔄 Falling back to mock mode")
        this.isPreviewMode = true
        this.client = null
      }
    }
  }

  async enrichEmployee(employee: Employee): Promise<EnrichedEmployee> {
    console.log(`\n=== ENRICHING EMPLOYEE: ${employee.name} (${employee.email}) ===`)
    console.log(`Mode: ${this.isPreviewMode ? "🎭 MOCK DATA" : "🔥 REAL APOLLO API"}`)

    if (this.isPreviewMode) {
      console.log("⚠️  Using mock data - add APOLLO_API_KEY for real results")
      return this.mockEnrichEmployee(employee)
    }

    try {
      let apolloResponse: ApolloPersonResponse | null = null
      const searchMethods = []
      let lastError: string | null = null

      // STRATEGY 1: Direct email search (FIXED: removed phone number requirement)
      try {
        console.log(`🔍 Searching Apollo API by email: ${employee.email}`)
        const emailResponse = await this.client.enrichPersonByEmail(employee.email, {
          revealPersonalEmails: false,
          // REMOVED: revealPhoneNumber to avoid webhook requirement
        })

        if (emailResponse && emailResponse.person) {
          apolloResponse = emailResponse.person
          console.log(`✅ Email search SUCCESS for ${employee.email}`)
          searchMethods.push("email")
        } else {
          console.log(`❌ Email search returned no data for ${employee.email}`)
        }
      } catch (emailError) {
        lastError = emailError instanceof Error ? emailError.message : "Email search failed"
        console.log(`❌ Email search FAILED for ${employee.email}:`, lastError)

        // If we get HTML response, there's an API issue
        if (lastError.includes("HTML instead of JSON")) {
          console.log("🔄 API returned HTML - possible authentication issue")
          throw new Error("Apollo API authentication failed - check your API key")
        }
      }

      // STRATEGY 2: Name + domain search (if email search failed)
      if (!apolloResponse) {
        const domain = employee.email.split("@")[1]

        if (domain) {
          try {
            console.log(`🔍 Searching Apollo API by name + domain: "${employee.name}" at ${domain}`)
            const nameResponse = await this.client.enrichPersonByName(employee.name, domain, {
              revealPersonalEmails: false,
              // REMOVED: revealPhoneNumber to avoid webhook requirement
            })

            if (nameResponse && nameResponse.person) {
              apolloResponse = nameResponse.person
              console.log(`✅ Name + domain search SUCCESS for ${employee.name}`)
              searchMethods.push("name+domain")
            } else {
              console.log(`❌ Name + domain search returned no data for ${employee.name}`)
            }
          } catch (nameError) {
            lastError = nameError instanceof Error ? nameError.message : "Name+domain search failed"
            console.log(`❌ Name + domain search FAILED for ${employee.name}:`, lastError)
          }
        }
      }

      // If no Apollo data found
      if (!apolloResponse) {
        console.log(`❌ NO APOLLO DATA FOUND for ${employee.name} - marking as invalid`)
        return {
          ...employee,
          status: "invalid",
          processedAt: new Date().toISOString(),
          errorMessage: lastError || "No data found in Apollo database",
        }
      }

      console.log(`✅ APOLLO DATA FOUND for ${employee.name} using: ${searchMethods.join(", ")}`)

      // Process Apollo response (UPDATED: handle phone numbers safely)
      const apolloData = {
        verifiedName: apolloResponse.name || `${apolloResponse.first_name} ${apolloResponse.last_name}`,
        verifiedEmail: apolloResponse.email || "",
        verifiedCompany: apolloResponse.organization?.name || "",
        verifiedPosition: apolloResponse.title || "",
        linkedinVerified: !!apolloResponse.linkedin_url,
        photoUrl: apolloResponse.photo_url,
        headline: apolloResponse.headline,
        location: [apolloResponse.city, apolloResponse.state, apolloResponse.country].filter(Boolean).join(", "),
        // UPDATED: Only include phone numbers if they exist (no webhook required)
        phoneNumbers: apolloResponse.phone_numbers?.map((p) => p.raw_number) || [],
      }

      // Calculate match score
      const matchCount = this.calculateMatchCount(employee, apolloData)
      let status: "exact" | "partial" | "invalid"

      if (matchCount >= 4) {
        status = "exact"
      } else if (matchCount >= 2) {
        status = "partial"
      } else {
        status = "invalid"
      }

      console.log(`🎯 MATCH RESULT for ${employee.name}: ${status} (${matchCount}/4 fields matched)`)

      return {
        ...employee,
        status,
        apolloData,
        linkedinUrl: apolloResponse.linkedin_url || undefined,
        processedAt: new Date().toISOString(),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error(`💥 ERROR enriching employee ${employee.id}:`, errorMessage)

      return {
        ...employee,
        status: "invalid",
        processedAt: new Date().toISOString(),
        errorMessage,
      }
    }
  }

  // FIXED: Deterministic mock data (only used when no API key)
  private mockEnrichEmployee(employee: Employee): EnrichedEmployee {
    console.log(`🎭 MOCK: Creating deterministic data for ${employee.name}`)

    // Create deterministic hash based on employee data
    const hash = this.simpleHash(employee.email + employee.name + employee.company)

    // FIXED: Deterministic scenarios based on hash (not random)
    const scenario = hash % 3

    if (scenario === 0) {
      // Exact match scenario
      return {
        ...employee,
        status: "exact",
        apolloData: {
          verifiedName: employee.name,
          verifiedEmail: employee.email,
          verifiedCompany: employee.company,
          verifiedPosition: employee.position,
          linkedinVerified: true,
          photoUrl: `https://images.unsplash.com/photo-${1500000000 + (hash % 100000000)}?w=150&h=150&fit=crop&crop=face`,
          headline: `${employee.position} at ${employee.company}`,
          location: "New York, NY",
          phoneNumbers: [`+1-555-${String(hash % 10000).padStart(4, "0")}`],
        },
        linkedinUrl: `https://linkedin.com/in/${employee.name.toLowerCase().replace(/\s+/g, "-")}-${hash % 1000}`,
        processedAt: new Date().toISOString(),
      }
    } else if (scenario === 1) {
      // Partial match scenario
      return {
        ...employee,
        status: "partial",
        apolloData: {
          verifiedName: this.varyName(employee.name, hash),
          verifiedEmail: employee.email,
          verifiedCompany: this.varyCompany(employee.company, hash),
          verifiedPosition: this.varyPosition(employee.position, hash),
          linkedinVerified: hash % 2 === 0,
          photoUrl: `https://images.unsplash.com/photo-${1500000000 + (hash % 100000000)}?w=150&h=150&fit=crop&crop=face`,
          headline: `Professional at ${this.varyCompany(employee.company, hash)}`,
          location: "San Francisco, CA",
          phoneNumbers: hash % 2 === 0 ? [`+1-555-${String(hash % 10000).padStart(4, "0")}`] : [],
        },
        linkedinUrl:
          hash % 2 === 0
            ? `https://linkedin.com/in/${employee.name.toLowerCase().replace(/\s+/g, "-")}-${hash % 1000}`
            : undefined,
        processedAt: new Date().toISOString(),
      }
    } else {
      // No match scenario
      return {
        ...employee,
        status: "invalid",
        processedAt: new Date().toISOString(),
        errorMessage: "No data found in Apollo database (mock)",
      }
    }
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private varyName(originalName: string, hash: number): string {
    const variations = [
      originalName,
      originalName
        .split(" ")
        .reverse()
        .join(" "), // Reverse first/last name
      originalName.replace(/\b\w/g, (l) => l.toUpperCase()), // Title case
      originalName.split(" ")[0] + " " + (originalName.split(" ")[1] || "").charAt(0) + ".", // First name + initial
    ]
    return variations[hash % variations.length]
  }

  private varyCompany(originalCompany: string, hash: number): string {
    const suffixes = ["Inc.", "Corp.", "LLC", "Ltd.", "Technologies", "Solutions"]
    const variations = [
      originalCompany,
      originalCompany + " " + suffixes[hash % suffixes.length],
      originalCompany.replace(/\b(Inc|Corp|LLC|Ltd)\b/gi, "").trim(),
      "The " + originalCompany,
    ]
    return variations[hash % variations.length]
  }

  private varyPosition(originalPosition: string, hash: number): string {
    const prefixes = ["Senior", "Lead", "Principal", "Staff", "Junior"]
    const variations = [
      originalPosition,
      prefixes[hash % prefixes.length] + " " + originalPosition,
      originalPosition.replace(/\b(Senior|Lead|Principal|Staff|Junior)\b/gi, "").trim(),
      originalPosition + " Manager",
    ]
    return variations[hash % variations.length].trim()
  }

  async bulkEnrichEmployees(employees: Employee[]): Promise<EnrichedEmployee[]> {
    console.log(`\n=== STARTING BULK ENRICHMENT FOR ${employees.length} EMPLOYEES ===`)
    console.log(`Mode: ${this.isPreviewMode ? "🎭 MOCK DATA" : "🔥 REAL APOLLO API"}`)

    const results: EnrichedEmployee[] = []

    // Process employees with appropriate delays
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i]
      console.log(`\nProcessing employee ${i + 1}/${employees.length}: ${employee.name}`)

      try {
        const result = await this.enrichEmployee(employee)
        results.push(result)

        // Add delay between requests (shorter for mock mode)
        if (i < employees.length - 1) {
          const delay = this.isPreviewMode ? 500 : 2000 // 0.5s for mock, 2s for real API
          console.log(`⏳ Waiting ${delay}ms before next employee...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      } catch (error) {
        console.error(`💥 Failed to process employee ${employee.id}:`, error)
        results.push({
          ...employee,
          status: "invalid",
          processedAt: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : "Processing failed",
        })
      }
    }

    console.log(`\n=== BULK ENRICHMENT COMPLETED ===`)
    console.log(`Mode: ${this.isPreviewMode ? "🎭 MOCK DATA" : "🔥 REAL APOLLO API"}`)
    console.log(`Total processed: ${results.length}`)
    console.log(`Exact matches: ${results.filter((r) => r.status === "exact").length}`)
    console.log(`Partial matches: ${results.filter((r) => r.status === "partial").length}`)
    console.log(`Invalid/No matches: ${results.filter((r) => r.status === "invalid").length}`)

    return results
  }

  private calculateMatchCount(employee: Employee, apolloData: any): number {
    let matches = 0

    console.log(`\n🔍 Calculating matches for ${employee.name}:`)

    // Name match
    const nameMatch = this.isNameMatch(employee.name, apolloData.verifiedName)
    if (nameMatch) {
      matches++
      console.log(`✓ Name match: "${employee.name}" = "${apolloData.verifiedName}"`)
    } else {
      console.log(`✗ Name mismatch: "${employee.name}" ≠ "${apolloData.verifiedName}"`)
    }

    // Email match
    const emailMatch = employee.email.toLowerCase().trim() === apolloData.verifiedEmail.toLowerCase().trim()
    if (emailMatch) {
      matches++
      console.log(`✓ Email match: "${employee.email}" = "${apolloData.verifiedEmail}"`)
    } else {
      console.log(`✗ Email mismatch: "${employee.email}" ≠ "${apolloData.verifiedEmail}"`)
    }

    // Company match
    const companyMatch = this.isCompanyMatch(employee.company, apolloData.verifiedCompany)
    if (companyMatch) {
      matches++
      console.log(`✓ Company match: "${employee.company}" = "${apolloData.verifiedCompany}"`)
    } else {
      console.log(`✗ Company mismatch: "${employee.company}" ≠ "${apolloData.verifiedCompany}"`)
    }

    // Position match
    const positionMatch = this.isPositionMatch(employee.position, apolloData.verifiedPosition)
    if (positionMatch) {
      matches++
      console.log(`✓ Position match: "${employee.position}" = "${apolloData.verifiedPosition}"`)
    } else {
      console.log(`✗ Position mismatch: "${employee.position}" ≠ "${apolloData.verifiedPosition}"`)
    }

    console.log(`🎯 Total matches: ${matches}/4`)
    return matches
  }

  private isNameMatch(originalName: string, verifiedName: string): boolean {
    if (!originalName || !verifiedName) return false

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, "")
    const original = normalize(originalName)
    const verified = normalize(verifiedName)

    if (original === verified) return true

    const originalParts = original.split(/\s+/)
    const verifiedParts = verified.split(/\s+/)

    if (originalParts.length >= 2 && verifiedParts.length >= 2) {
      const originalFirst = originalParts[0]
      const originalLast = originalParts[originalParts.length - 1]
      const verifiedFirst = verifiedParts[0]
      const verifiedLast = verifiedParts[verifiedParts.length - 1]

      return (
        (originalFirst === verifiedFirst && originalLast === verifiedLast) ||
        (originalFirst === verifiedLast && originalLast === verifiedFirst)
      )
    }

    return false
  }

  private isCompanyMatch(originalCompany: string, verifiedCompany: string): boolean {
    if (!originalCompany || !verifiedCompany) return false

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, "")
    const original = normalize(originalCompany)
    const verified = normalize(verifiedCompany)

    if (original === verified) return true

    const originalCore = original
      .replace(/\b(inc|corp|llc|ltd|company|co|solutions|technologies|tech|systems|group|corporation)\b/g, "")
      .trim()
    const verifiedCore = verified
      .replace(/\b(inc|corp|llc|ltd|company|co|solutions|technologies|tech|systems|group|corporation)\b/g, "")
      .trim()

    if (originalCore && verifiedCore) {
      return originalCore === verifiedCore || originalCore.includes(verifiedCore) || verifiedCore.includes(originalCore)
    }

    return false
  }

  private isPositionMatch(originalPosition: string, verifiedPosition: string): boolean {
    if (!originalPosition || !verifiedPosition) return false

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, "")
    const original = normalize(originalPosition)
    const verified = normalize(verifiedPosition)

    if (original === verified) return true

    const removeSeniority = (str: string) =>
      str.replace(/\b(junior|senior|lead|principal|staff|sr|jr|chief|head|director|executive)\b/g, "").trim()
    const originalCore = removeSeniority(original)
    const verifiedCore = removeSeniority(verified)

    if (originalCore && verifiedCore) {
      return originalCore === verifiedCore || originalCore.includes(verifiedCore) || verifiedCore.includes(originalCore)
    }

    return false
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (this.isPreviewMode) {
      return {
        success: false,
        message:
          "⚠️  No Apollo API key configured - using mock data. Add APOLLO_API_KEY to .env.local for real results.",
        details: { mode: "mock", reason: "no_api_key" },
      }
    }

    try {
      console.log("🧪 Testing Apollo API connection...")
      const result = await this.client.testConnection()
      return {
        success: true,
        message: "✅ " + result.message,
        details: result,
      }
    } catch (error) {
      console.error("❌ Apollo API connection test failed:", error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return {
        success: false,
        message: "❌ Apollo API connection failed: " + errorMessage,
        details: { error: error instanceof Error ? error.stack : error },
      }
    }
  }

  async searchPeopleByCompany(companyDomain: string, titles: string[] = []): Promise<ApolloPersonResponse[]> {
    if (this.isPreviewMode) {
      console.log(`🎭 MOCK: Searching people by company: ${companyDomain}`)
      return [] // Return empty array for mock mode
    }

    try {
      console.log(`🔍 Searching people by company: ${companyDomain}`)
      const response = await this.client.searchPeople({
        organizationDomains: [companyDomain],
        personTitles: titles.length > 0 ? titles : undefined,
        perPage: 25,
      })
      console.log(`✅ Found ${response.people?.length || 0} people for company ${companyDomain}`)
      return response.people || []
    } catch (error) {
      console.error("❌ Error searching people by company:", error)
      return []
    }
  }
}

export const apolloService = new ApolloService()
export type { EnrichedEmployee }
