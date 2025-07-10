# Database Validator - Complete Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Environment Setup
\`\`\`bash
# Copy the environment template
cp .env.local.example .env.local

# Edit .env.local and add your Apollo API key
APOLLO_API_KEY=your_apollo_api_key_here
\`\`\`

### 3. Run the Application
\`\`\`bash
npm run dev
\`\`\`

### 4. Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Required Dependencies

All dependencies are included in package.json:

### Core Dependencies
- **Next.js 14**: React framework
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **xlsx**: Excel file processing

### UI Components
- **@radix-ui/react-progress**: Progress bars
- **@radix-ui/react-select**: Dropdown selects
- **@radix-ui/react-label**: Form labels
- **lucide-react**: Icons
- **class-variance-authority**: Component variants

### Utilities
- **clsx**: Conditional classes
- **tailwind-merge**: Tailwind class merging
- **tailwindcss-animate**: CSS animations

## 🔧 Configuration Files

### Next.js Configuration (`next.config.mjs`)
- Excel file processing support
- Image optimization for Unsplash
- Environment variable exposure

### Tailwind Configuration (`tailwind.config.js`)
- Custom color scheme
- Animation keyframes
- Responsive breakpoints
- shadcn/ui integration

### TypeScript Configuration (`tsconfig.json`)
- Path aliases (@/*)
- Strict type checking
- Next.js plugin integration

## 🌐 API Endpoints

### File Upload
- `POST /api/upload` - Upload Excel/CSV files
- `GET /api/employees/[fileId]` - Get employee data

### Analysis
- `POST /api/analysis/start` - Start Apollo analysis
- `GET /api/analysis/status` - Get analysis progress

### Downloads
- `POST /api/download` - Export results as CSV

### Testing
- `GET /api/test-connection` - Test Apollo API connection
- `POST /api/test-apollo` - Comprehensive API testing

## 📁 File Structure

\`\`\`
database-validator/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── analysis/          # Analysis page
│   ├── test-apollo/       # Testing page
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── apollo-client.ts  # Apollo API client
│   ├── apollo-service.ts # Business logic
│   └── utils.ts          # Helper functions
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── next.config.mjs       # Next.js configuration
\`\`\`

## 🔑 Apollo API Setup

### 1. Get API Key
1. Sign up at [apollo.io](https://apollo.io)
2. Go to Settings > API
3. Generate a new API key

### 2. Add to Environment
\`\`\`bash
# In .env.local
APOLLO_API_KEY=your_actual_api_key_here
\`\`\`

### 3. Test Connection
- Visit `/test-apollo` page
- Click "Test Connection"
- Verify API is working

## 🎯 Features

### File Upload
- ✅ Excel (.xlsx, .xls) support
- ✅ CSV file support
- ✅ Drag & drop interface
- ✅ File validation
- ✅ Progress tracking

### Data Processing
- ✅ Smart column detection
- ✅ Apollo API integration
- ✅ Batch processing
- ✅ Real-time progress
- ✅ Error handling

### Results & Export
- ✅ Match categorization (Exact/Partial/Invalid)
- ✅ Detailed employee views
- ✅ LinkedIn profile links
- ✅ CSV export functionality
- ✅ Search and filtering

### Testing & Debugging
- ✅ API connection testing
- ✅ Mock data for development
- ✅ Comprehensive error logging
- ✅ Performance monitoring

## 🚨 Troubleshooting

### Common Issues

**Dependencies not installing:**
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
\`\`\`

**Apollo API not working:**
\`\`\`bash
# Check API key in .env.local
echo $APOLLO_API_KEY

# Test connection
curl http://localhost:3000/api/test-connection
\`\`\`

**Build errors:**
\`\`\`bash
# Check TypeScript errors
npm run lint

# Clean build
rm -rf .next
npm run build
\`\`\`

### Development Mode
- Uses mock data when Apollo API is not configured
- Automatic fallback for preview environments
- Detailed console logging for debugging

### Production Mode
- Requires valid Apollo API key
- Real API calls with rate limiting
- Optimized performance

## 📊 Performance

### File Processing
- **Small files** (< 100 employees): ~30 seconds
- **Medium files** (100-500 employees): ~2-5 minutes
- **Large files** (500+ employees): ~5-15 minutes

### Rate Limiting
- **Apollo API**: 100 requests/minute (configurable)
- **Batch size**: 5 employees per batch
- **Delays**: 2 seconds between batches

## 🔒 Security

### Data Protection
- No permanent file storage
- In-memory processing only
- API keys in environment variables
- Input validation and sanitization

### Best Practices
- HTTPS enforcement
- Rate limiting protection
- Error message sanitization
- Secure file upload validation

---

**Ready to validate your employee database with Apollo API!** 🚀
