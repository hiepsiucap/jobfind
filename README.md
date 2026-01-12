# JobFind - Modern Job Search Platform

A comprehensive job search platform built with Next.js, featuring AI-powered CV parsing and generation, job search, and posting capabilities.

## 🚀 Features

### For Job Seekers
- **Job Search & Discovery**: Browse thousands of job listings with advanced search and filtering
- **Smart Filters**: Filter by job type, experience level, location, salary, and remote options
- **CV Management**: Create, upload, and manage your professional CV
- **AI CV Parser**: Upload your existing CV and let AI extract all information automatically
- **AI CV Generator**: Generate a professional, ATS-friendly CV using AI
- **Job Applications**: Apply to jobs directly with your CV
- **Save Jobs**: Bookmark interesting positions for later

### For Employers
- **Post Jobs**: Create detailed job listings with custom requirements and benefits
- **Job Management**: Edit and manage your job postings
- **Candidate Search**: Find qualified candidates based on skills and experience

### Technical Features
- **Modern UI/UX**: Beautiful, responsive design with Tailwind CSS
- **Type Safety**: Fully typed with TypeScript
- **Modular Architecture**: Reusable components and clean code structure
- **API Routes**: RESTful API endpoints for all operations
- **Mock Data**: Pre-populated with sample jobs and CVs for testing

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React Icons, Radix UI
- **Form Handling**: React Hook Form concepts
- **File Upload**: React Dropzone
- **Date Formatting**: date-fns

## 📦 Installation

1. **Clone the repository** (or you're already in the project directory)

2. **Install dependencies**:
```bash
npm install
```

3. **Run the development server**:
```bash
npm run dev
```

4. **Open your browser** and navigate to:
```
http://localhost:3000
```

## 📁 Project Structure

```
jobfind/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── jobs/         # Job-related endpoints
│   │   └── cv/           # CV-related endpoints
│   ├── jobs/[id]/        # Job detail page
│   ├── post-job/         # Job posting page
│   ├── cv/               # CV management page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page (job search)
├── components/            # Reusable components
│   ├── cv/               # CV-specific components
│   ├── Header.tsx        # Navigation header
│   ├── JobCard.tsx       # Job listing card
│   ├── SearchBar.tsx     # Search interface
│   └── FilterPanel.tsx   # Filter sidebar
├── lib/                   # Utility functions
│   ├── mock-data.ts      # Sample data
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
│   └── index.ts          # Core types (Job, CV, etc.)
└── public/               # Static assets
```

## 🎯 Key Pages

### Home Page (`/`)
- Job search interface with search bar
- Advanced filtering options
- Grid of job cards
- Real-time search and filtering

### Job Detail (`/jobs/[id]`)
- Comprehensive job information
- Company details
- Requirements and benefits
- Quick apply functionality

### Post Job (`/post-job`)
- Job posting form for employers
- Rich text descriptions
- Salary range configuration
- Category and experience level selection

### CV Management (`/cv`)
Three main tabs:
1. **My CV**: View your professional CV
2. **Upload & Parse**: Upload existing CV for AI parsing
3. **Generate with AI**: Create new CV using AI

## 🔌 API Endpoints

### Jobs
- `GET /api/jobs` - List all jobs with optional filters
- `GET /api/jobs/[id]` - Get single job details
- `POST /api/jobs` - Create new job posting
- `PUT /api/jobs/[id]` - Update job posting
- `DELETE /api/jobs/[id]` - Delete job posting

### CV
- `GET /api/cv?userId=[id]` - Get user's CV
- `POST /api/cv` - Create new CV
- `PUT /api/cv` - Update existing CV
- `POST /api/cv/parse` - Parse uploaded CV with AI
- `POST /api/cv/generate` - Generate CV with AI

## 🎨 Design Features

- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Modern Color Scheme**: Professional blue and purple gradients
- **Smooth Animations**: Subtle transitions and hover effects
- **Accessible**: ARIA labels and keyboard navigation support
- **Clean Typography**: Optimized for readability

## 🔮 Future Enhancements

- [ ] User authentication (sign up/login)
- [ ] Real database integration (PostgreSQL, MongoDB)
- [ ] Actual AI integration (OpenAI GPT-4, Claude)
- [ ] Email notifications
- [ ] Application tracking system
- [ ] Company profiles
- [ ] Advanced analytics dashboard
- [ ] PDF export for CVs
- [ ] Interview scheduling
- [ ] Salary insights and trends

## 🤖 AI Integration Notes

The current implementation includes mock AI endpoints. To integrate real AI:

1. **CV Parsing**: Use OpenAI's GPT-4 or Claude with document parsing
2. **CV Generation**: Prompt engineering for professional CV creation
3. **Job Matching**: ML algorithms to match candidates with jobs
4. **Recommendation System**: Suggest relevant jobs based on CV

Example AI prompt structure:
```
Parse the following CV and extract structured information including:
- Personal information (name, email, phone, location)
- Work experience with dates, companies, and achievements
- Education history
- Skills and certifications
- Languages

[CV text here]

Return in JSON format following this schema...
```

## 🛡️ Environment Variables

Create a `.env.local` file for production use:

```env
# Database
DATABASE_URL=your_database_url

# AI Services
OPENAI_API_KEY=your_openai_key
# or
ANTHROPIC_API_KEY=your_claude_key

# Authentication
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
```

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🤝 Contributing

This is a demo project, but you can extend it with:
- Real authentication
- Database models
- Payment integration for job postings
- Advanced search with Elasticsearch
- Real-time chat for recruitment

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 👨‍💻 Author

Built with ❤️ using Next.js and modern web technologies.

---

**Note**: This is a demonstration project with mock data. For production use, you'll need to:
1. Set up a real database
2. Implement authentication
3. Integrate actual AI services
4. Add payment processing
5. Set up email services
6. Implement proper error handling and validation
