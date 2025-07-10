interface ApolloConfig {
  apiKey: string
  baseUrl: string
  rateLimitPerMinute: number
}

interface ApolloSearchParams {
  email?: string
  firstName?: string
  lastName?: string
  name?: string
  domain?: string
  personTitles?: string[]
  personLocations?: string[]
  organizationDomains?: string[]
  perPage?: number
  q?: string
}

interface ApolloPersonResponse {
  id: string
  first_name: string
  last_name: string
  name: string
  linkedin_url?: string
  title: string
  email_status: string
  photo_url?: string
  headline?: string
  email: string
  organization_id?: string
  employment_history?: Array<{
    organization_name: string
    title: string
    start_date?: string
    end_date?: string
    current: boolean
  }>
  state?: string
  city?: string
  country?: string
  organization?: {
    id: string
    name: string
    website_url?: string
    linkedin_url?: string
    primary_phone?: {
      number: string
      sanitized_number: string
    }
  }
  phone_numbers?: Array<{
    raw_number: string
    sanitized_number: string
    type: string
  }>
}

interface ApolloSearchResponse {
  people: ApolloPersonResponse[]
  pagination?: {
    page: number
    per_page: number
    total_entries: number
    total_pages: number
  }
}

interface ApolloEnrichResponse {
  person: ApolloPersonResponse
}

class ApolloClient {
  private config: ApolloConfig
  private requestCount = 0
  private lastResetTime: number = Date.now()

  constructor(config: ApolloConfig) {
    this.config = config
    console.log("🚀 Apollo Client initialized with API key:", config.apiKey.substring(0, 8) + "...")
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceReset = now - this.lastResetTime

    if (timeSinceReset >= 60000) {
      this.requestCount = 0
      this.lastResetTime = now
    }

    if (this.requestCount >= this.config.rateLimitPerMinute) {
      const waitTime = 60000 - timeSinceReset
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    this.requestCount++
    console.log(`📊 Apollo API Request ${this.requestCount}/${this.config.rateLimitPerMinute} this minute`)
  }

  private async makeRequest<T>(endpoint: string, body: Record<string, any> = {}): Promise<T> {
    await this.checkRateLimit()

    console.log(`🔍 Making Apollo API request to: ${this.config.baseUrl}${endpoint}`)
    console.log("📤 Request body:", JSON.stringify(body, null, 2))

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Api-Key": this.config.apiKey,
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      })

      console.log(`📥 Apollo API Response Status: ${response.status}`)

      // Check if response is HTML (error page)
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        const htmlText = await response.text()
        console.error("❌ Received HTML response instead of JSON:", htmlText.substring(0, 500))
        throw new Error(
          `Apollo API returned HTML instead of JSON. This usually indicates an authentication or endpoint error. Status: ${response.status}`,
        )
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Apollo API Error: ${errorText}`)

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Apollo API authentication failed. Please check your API key.")
        } else if (response.status === 403) {
          throw new Error("Apollo API access forbidden. Please check your API key permissions.")
        } else if (response.status === 429) {
          throw new Error("Apollo API rate limit exceeded. Please wait before making more requests.")
        } else {
          throw new Error(`Apollo API Error (${response.status}): ${errorText}`)
        }
      }

      const data = await response.json()
      console.log("✅ Apollo API Response received successfully")
      return data
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Network error: Unable to connect to Apollo API. Please check your internet connection.")
      }
      throw error
    }
  }

  async searchPeople(params: ApolloSearchParams): Promise<ApolloSearchResponse> {
    const requestBody: Record<string, any> = {
      per_page: params.perPage || 10,
    }

    if (params.q) {
      requestBody.q = params.q
    }

    if (params.personTitles?.length) {
      requestBody.person_titles = params.personTitles
    }
    if (params.personLocations?.length) {
      requestBody.person_locations = params.personLocations
    }
    if (params.organizationDomains?.length) {
      requestBody.q_organization_domains_list = params.organizationDomains
    }

    return this.makeRequest<ApolloSearchResponse>("/api/v1/mixed_people/search", requestBody)
  }

  async enrichPersonByEmail(
    email: string,
    options: {
      revealPersonalEmails?: boolean
    } = {},
  ): Promise<ApolloEnrichResponse> {
    const requestBody = {
      email,
      reveal_personal_emails: options.revealPersonalEmails || false,
      // REMOVED: reveal_phone_number to avoid webhook requirement
    }

    return this.makeRequest<ApolloEnrichResponse>("/api/v1/people/match", requestBody)
  }

  async enrichPersonByName(
    name: string,
    domain: string,
    options: {
      revealPersonalEmails?: boolean
    } = {},
  ): Promise<ApolloEnrichResponse> {
    const requestBody = {
      name,
      domain,
      reveal_personal_emails: options.revealPersonalEmails || false,
      // REMOVED: reveal_phone_number to avoid webhook requirement
    }

    return this.makeRequest<ApolloEnrichResponse>("/api/v1/people/match", requestBody)
  }

  async enrichPersonByNameParts(
    firstName: string,
    lastName: string,
    domain: string,
    options: {
      revealPersonalEmails?: boolean
    } = {},
  ): Promise<ApolloEnrichResponse> {
    const requestBody = {
      first_name: firstName,
      last_name: lastName,
      domain,
      reveal_personal_emails: options.revealPersonalEmails || false,
      // REMOVED: reveal_phone_number to avoid webhook requirement
    }

    return this.makeRequest<ApolloEnrichResponse>("/api/v1/people/match", requestBody)
  }

  async testConnection(): Promise<{ status: string; message: string }> {
    try {
      console.log("🧪 Testing Apollo API connection with your API key...")
      const response = await this.searchPeople({ perPage: 1 })
      console.log("✅ Apollo API connection test successful!")
      return {
        status: "success",
        message:
          "Apollo API connection successful with your API key - found " + (response.people?.length || 0) + " results",
      }
    } catch (error) {
      console.error("❌ Apollo API connection test failed:", error)
      throw new Error(`Apollo API connection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}

export function createApolloClient(): ApolloClient {
  const config: ApolloConfig = {
    apiKey: process.env.APOLLO_API_KEY || "oB_syiW7W6rHKrlLUvc0tQ", // Your API key as fallback
    baseUrl: process.env.APOLLO_API_URL || "https://api.apollo.io",
    rateLimitPerMinute: Number.parseInt(process.env.APOLLO_API_RATE_LIMIT || "100"),
  }

  if (!config.apiKey) {
    throw new Error("Apollo API key is required. Please set APOLLO_API_KEY environment variable.")
  }

  console.log("🔧 Creating Apollo client with your API key:", {
    baseUrl: config.baseUrl,
    rateLimitPerMinute: config.rateLimitPerMinute,
    apiKeyPresent: !!config.apiKey,
    apiKeyPreview: config.apiKey.substring(0, 8) + "...",
  })

  return new ApolloClient(config)
}

export type { ApolloPersonResponse, ApolloSearchResponse, ApolloEnrichResponse, ApolloSearchParams }
