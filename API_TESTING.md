# API Testing and Validation Guide

## Testing Backend Communication

### 1. API Connection Status
The application includes a built-in API status indicator that automatically tests:
- ✅ API key configuration
- ✅ Backend connectivity  
- ✅ Apollo API communication

### 2. Manual Testing Endpoints

#### Test API Connection
\`\`\`bash
GET /api/test-connection
\`\`\`
**Response:**
\`\`\`json
{
  "success": true,
  "message": "API connection successful",
  "apiKeyStatus": "valid",
  "connectionStatus": "connected"
}
\`\`\`

#### Validate Complete Setup
\`\`\`bash
GET /api/validate-setup
\`\`\`
**Response:**
\`\`\`json
{
  "success": true,
  "configured": true,
  "results": {
    "apiKey": { "configured": true, "status": "present" },
    "environment": { "nodeEnv": "development" }
  }
}
\`\`\`

### 3. Validation Techniques

#### File Upload Validation
- ✅ File type checking (.xlsx, .xls, .csv)
- ✅ File size limits (10MB max)
- ✅ Required column detection
- ✅ Data format validation

#### API Integration Validation
- ✅ Environment variable presence
- ✅ API key format validation
- ✅ Connection timeout handling
- ✅ Rate limiting compliance

#### Data Processing Validation
- ✅ Field matching algorithms
- ✅ Status categorization (exact/partial/invalid)
- ✅ Error handling and recovery
- ✅ Progress tracking accuracy

### 4. Development vs Production

#### Development Mode
- Uses mock API responses for testing
- Simulates realistic Apollo API behavior
- No actual API calls made
- Perfect for frontend development

#### Production Mode
- Makes real Apollo API calls
- Requires valid API key
- Implements rate limiting
- Full error handling

### 5. Troubleshooting

#### Common Issues & Solutions

**API Key Not Working:**
\`\`\`bash
# Check if key is set
echo $APOLLO_API_KEY

# Test connection
curl http://localhost:3000/api/test-connection
\`\`\`

**Backend Not Responding:**
\`\`\`bash
# Check server status
curl http://localhost:3000/api/validate-setup

# Restart development server
npm run dev
\`\`\`

**File Upload Failing:**
- Check file format and size
- Verify required columns exist
- Review browser console for errors

### 6. Monitoring & Logging

The application logs all API interactions:
- Request/response timing
- Error details and stack traces
- Rate limiting status
- Processing progress

Check the browser console and server logs for detailed information.
