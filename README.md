# Resume to QA Bot

## Project Overview

An AI-powered application that parses resumes and automatically generates **React-specific technical interview questions** for candidates. The system features a dual-interface design supporting both interviewees and interviewers, with robust resume parsing, intelligent question generation, and comprehensive data validation.

## 🚀 Key Features

### **For Interviewees**
- **Smart Resume Parsing**: Automatically extract candidate information (name, email, phone, role) from PDF, DOCX, and TXT files
- **Advanced Data Validation**: Multi-layer validation to eliminate fake data and ensure accurate information extraction
- **React-Specific Questions**: Generate 6 technical interview questions focused exclusively on React development
- **Interactive Interview Interface**: Real-time question display with timed responses and answer submission
- **Seamless User Experience**: Modern, responsive UI with smooth transitions and intuitive navigation

### **For Interviewers** 
- **Interviewer Dashboard**: Comprehensive view of interview sessions and candidate responses
- **Question Analytics**: Track question difficulty distribution and candidate performance
- **Real-time Monitoring**: Live updates of interview progress and completion status

### **Technical Capabilities**
- **Multi-format Support**: Handle PDF, DOCX, and TXT resume files with intelligent text extraction
- **AI-Powered Processing**: Advanced AI models for resume parsing and question generation
- **React-Exclusive Focus**: All generated questions are strictly React-specific, eliminating generic content
- **Performance Optimized**: Built with modern React patterns and performance optimization techniques

## 🎯 React Question Generation

The system generates **exclusively React-specific technical interview questions** covering:

### **Core React Topics**
- **React Hooks**: useState, useEffect, useMemo, useCallback, useContext, useReducer, useRef, custom hooks
- **Component Architecture**: Functional vs class components, Higher-Order Components, render props
- **State Management**: Context API, Redux, Zustand, and other state management solutions
- **Performance Optimization**: React.memo, useMemo, useCallback, code splitting, lazy loading, virtualization
- **React Router**: Routing concepts, nested routes, route parameters, navigation
- **React Testing**: React Testing Library, Jest, component testing, hook testing
- **React Internals**: Virtual DOM, reconciliation, fiber architecture, component lifecycle
- **React Forms**: Controlled vs uncontrolled components, form validation, form libraries
- **React Patterns**: Compound components, render props, provider pattern
- **React Ecosystem**: Next.js, React Native, React Query, React Hook Form

### **Question Difficulty Levels**
- **2 Easy Questions**: Fundamental React concepts and basic hook usage
- **2 Medium Questions**: Intermediate patterns, performance optimization, custom hooks
- **2 Hard Questions**: Advanced React internals, complex state management, architecture decisions

### **Strict Quality Control**
- **No Generic Questions**: Eliminates "What is your favorite programming language?" and similar non-technical questions
- **No Non-React Content**: Strictly forbids Node.js, databases, DevOps, ML, and other unrelated topics
- **Technical Focus**: All questions require specific React knowledge and code examples
- **Practical Scenarios**: Real-world React development problems and best practices

## 🛠️ Technology Stack

### **Frontend**
- **React 18.3.1** with TypeScript for type safety and modern React features
- **Vite 5.4.19** for fast development and building
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for beautiful, accessible UI components
- **React Router DOM 6.30.1** for client-side routing
- **React Hook Form 7.61.1** with Zod validation for form handling
- **TanStack React Query 5.83.0** for server state management
- **Radix UI** for primitive UI components

### **Backend & AI**
- **Supabase** for serverless functions and database
- **Deno** runtime for edge functions
- **Google Gemini 2.5 Flash** AI model for intelligent processing
- **Custom AI prompts** optimized for React-specific question generation

### **Development Tools**
- **TypeScript 5.8.3** for static type checking
- **ESLint 9.32.0** with React-specific rules
- **PostCSS** and **Autoprefixer** for CSS processing
- **Vite** for development server and building

## 📦 Project Structure

```
resume-to-qa-bot/
├── src/
│   ├── components/          # React components
│   │   ├── InterviewChat.tsx        # Main interview interface
│   │   ├── InterviewerDashboard.tsx # Interviewer management
│   │   └── ui/                     # shadcn/ui components
│   ├── pages/              # Application pages
│   │   ├── Index.tsx              # Main application with tabs
│   │   └── NotFound.tsx           # 404 page
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── integrations/       # Third-party integrations
├── supabase/
│   ├── functions/
│   │   ├── generate-questions/    # React question generation
│   │   └── parse-resume/          # Resume parsing and validation
│   └── config.toml        # Supabase configuration
├── public/                # Static assets
└── config files           # TypeScript, Tailwind, Vite configs
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js & npm installed
- Supabase account and project
- AI API key configuration

### **Installation**

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd resume-to-qa-bot

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Copy .env.example to .env and configure:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - AI_API_KEY (for Supabase functions)

# 4. Start development server
npm run dev
```

### **Available Scripts**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Supabase Functions**

Configure the following environment variables in your Supabase project:

```env
AI_API_KEY=your_ai_api_key
```

### **Supabase Configuration**

The `supabase/config.toml` file configures:
- Project ID: `hkdqgzjkhuumlupoywcl`
- Function settings with JWT verification disabled

## 🎨 User Interface

### **Dual-Tab Design**
- **Interviewee Tab**: Complete interview workflow from resume upload to completion
- **Interviewer Tab**: Dashboard for monitoring and managing interviews

### **Key Components**
- **File Upload**: Drag-and-drop resume file upload with format validation
- **Information Review**: Editable form for confirming extracted candidate data
- **Question Display**: Timed question presentation with answer input
- **Progress Tracking**: Visual progress indicators and completion status
- **Results Summary**: Comprehensive interview results and performance metrics

## 🔒 Data Validation & Security

### **Resume Parsing Validation**
- **Multi-layer Validation**: Regex extraction + AI processing + strict filtering
- **Fake Data Prevention**: Blocks generic names, emails, and roles
- **Text Presence Verification**: Ensures extracted data appears in actual resume text
- **Pattern Matching**: Advanced regex patterns for contact information extraction

### **Question Generation Quality**
- **React-Only Focus**: Strict elimination of non-React topics
- **Technical Depth**: Questions require specific React knowledge and code examples
- **Difficulty Balancing**: Proper distribution of easy, medium, and hard questions
- **Content Filtering**: Removal of generic behavioral and non-technical questions

## 🚀 Deployment

### **Local Development**

```bash
# Start development server
npm run dev

# Application runs at http://localhost:8080
```

### **Production Deployment**

#### **Using Lovable**
1. Open [Lovable](https://lovable.dev/projects/61397756-d44f-4c3f-9d54-25b651265587)
2. Click on Share → Publish
3. Configure deployment settings

#### **Custom Domain**

To connect a custom domain:
1. Navigate to Project → Settings → Domains
2. Click Connect Domain
3. Follow the domain setup instructions

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

#### **Manual Deployment**

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

### **Development Workflow**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper TypeScript typing
4. **Run linting**: `npm run lint`
5. **Test your changes** thoroughly
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### **Code Style**

- Follow TypeScript best practices
- Use ESLint configuration
- Maintain consistent formatting with Prettier (if configured)
- Write meaningful commit messages
- Include proper JSDoc comments for functions

## 🐛 Troubleshooting

### **Common Issues**

#### **Resume Parsing Problems**
- **Issue**: Fake data like "John Doe" or "example@email.com"
- **Solution**: The validation system automatically blocks and filters out generic patterns

#### **Generic Questions Generated**
- **Issue**: Non-React or generic interview questions appear
- **Solution**: The system includes strict filters to eliminate non-React content and generic questions

#### **File Upload Errors**
- **Issue**: Unsupported file format or corrupted files
- **Solution**: Ensure files are PDF, DOCX, or TXT and not password-protected

#### **AI API Errors**
- **Issue**: AI service unavailable or rate limits
- **Solution**: Check AI_API_KEY configuration and service status

### **Debug Mode**

The application includes comprehensive logging:
- **Backend**: Console logs for resume parsing and question generation
- **Frontend**: Debug information for data validation and user interactions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing React framework
- **Supabase** for the excellent backend-as-a-service platform
- **shadcn/ui** for the beautiful component library
- **Vite** for the lightning-fast build tool
- **Google AI** for the powerful language model

## 📞 Support

For support, questions, or feature requests:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the console logs for debugging information

---

Built with ❤️ using React, TypeScript, and modern web technologies.
