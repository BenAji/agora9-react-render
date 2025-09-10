# AGORA Development Guide 01: Project Setup & Environment

> **⚠️ PREREQUISITE:** This is Document 1 of 10 in the AGORA development sequence. Complete this entirely before proceeding to Document 2.

## 📋 Overview

This document guides you through setting up the complete AGORA project structure, development environment, and foundational tools using **Cursor AI IDE**. You'll establish a monorepo structure that will house both backend and frontend components.

## 🎯 What You'll Accomplish

- ✅ Set up monorepo project structure
- ✅ Configure development environment 
- ✅ Initialize Git repository with proper branching
- ✅ Set up essential development tools
- ✅ Create project documentation structure
- ✅ Establish coding standards and conventions

## 📁 Final Project Structure

After completing this document, you'll have:

```
agora-dev/
├── .gitignore
├── .cursorrules
├── package.json
├── README.md
├── docs/
│   ├── development/
│   └── deployment/
├── backend/
│   ├── supabase/
│   │   ├── config.toml
│   │   ├── migrations/
│   │   └── functions/
│   ├── scripts/
│   └── types/
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── shared/
│   ├── types/
│   └── constants/
└── tools/
    ├── scripts/
    └── configs/
```

---

## 🚀 Step 1: Environment Prerequisites

### **1.1 Install Required Software**

Before starting, ensure you have these installed:

```bash
# Check if Node.js is installed (v18+ required)
node --version

# Check if npm is installed
npm --version

# Check if Git is installed
git --version
```

**If missing, install:**
- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **Git**: Download from [git-scm.com](https://git-scm.com/)
- **Cursor AI IDE**: Download from [cursor.sh](https://cursor.sh/)

### **1.2 Install Supabase CLI**

```bash
# Install Supabase CLI globally
npm install -g supabase

# Verify installation
supabase --version
```

### **1.3 Install Additional Development Tools**

```bash
# Install useful global packages
npm install -g typescript tsx nodemon prettier eslint
```

---

## 🏗️ Step 2: Create Project Structure

### **2.1 Initialize Main Project Directory**

**Cursor AI Prompt:**
```
Create a new directory called "agora-dev" and initialize it as a Node.js project with TypeScript support. Set up the basic package.json with workspace configuration for a monorepo structure.
```

**Manual Commands (if needed):**
```bash
# Create project directory
mkdir agora-dev
cd agora-dev

# Initialize npm project
npm init -y

# Install workspace management
npm install -D npm-run-all concurrently
```

### **2.2 Create Monorepo Structure**

**Cursor AI Prompt:**
```
Create the complete directory structure for the AGORA monorepo with the following folders:
- backend/ (for Supabase backend code)
- frontend/ (for React application)
- shared/ (for shared types and utilities)
- docs/ (for documentation)
- tools/ (for development scripts and configs)

Include appropriate .gitkeep files in empty directories.
```

### **2.3 Configure Package.json for Monorepo**

**Cursor AI Prompt:**
```
Update the root package.json to configure this as a monorepo workspace with the following requirements:
- Set workspaces for frontend, backend, and shared packages
- Add scripts for running development, build, and test commands across all packages
- Include devDependencies for TypeScript, ESLint, Prettier
- Set up npm scripts that can run frontend and backend simultaneously
```

**Expected package.json structure:**
```json
{
  "name": "agora-dev",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "npm run dev --workspace=backend",
    "dev:frontend": "npm run dev --workspace=frontend",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "setup": "npm install && npm run setup --workspaces"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "concurrently": "^8.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "npm-run-all": "^4.1.5",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 📝 Step 3: Configure Development Tools

### **3.1 Create TypeScript Configuration**

**Cursor AI Prompt:**
```
Create a root tsconfig.json file for the monorepo with proper configuration for TypeScript 5+. Include path mapping for shared modules and strict type checking. Also create tsconfig files for each workspace (frontend, backend, shared) that extend the root config.
```

### **3.2 Set Up ESLint Configuration**

**Cursor AI Prompt:**
```
Create an .eslintrc.js configuration file with rules for:
- TypeScript support
- React support (for frontend)
- Node.js support (for backend)
- Prettier integration
- Import/export rules
- Office.js specific rules
Include separate configs for frontend and backend workspaces.
```

### **3.3 Configure Prettier**

**Cursor AI Prompt:**
```
Create a .prettierrc configuration file with consistent formatting rules for the AGORA project. Include .prettierignore file to exclude build directories, node_modules, and generated files.
```

### **3.4 Create Cursor AI Rules**

**Cursor AI Prompt:**
```
Create a .cursorrules file with specific instructions for the Cursor AI to follow when working on the AGORA project:
- Coding standards and conventions
- TypeScript best practices
- React and Office.js specific guidelines
- File naming conventions
- Comment and documentation standards
```

**Example .cursorrules content:**
```
# AGORA Project Cursor AI Rules

## General Guidelines
- Always use TypeScript with strict mode enabled
- Follow functional programming patterns where possible
- Use descriptive variable and function names
- Include JSDoc comments for all public functions
- Prefer const over let, avoid var

## File Naming Conventions
- React components: PascalCase (e.g., EventCalendar.tsx)
- Utilities and hooks: camelCase (e.g., useAuth.ts)
- Types and interfaces: PascalCase with descriptive names
- API files: kebab-case (e.g., event-management.ts)

## React Specific
- Use functional components with hooks
- Implement proper TypeScript interfaces for props
- Use React.memo for performance optimization when needed
- Follow React Query patterns for data fetching

## Backend Specific
- Use async/await instead of promises
- Implement proper error handling with try/catch
- Follow RESTful API conventions
- Include input validation for all endpoints

## Office.js Specific
- Always check Office.context availability
- Use proper error handling for Office API calls
- Follow Office add-in security best practices
- Include cross-platform compatibility considerations
```

---

## 🔧 Step 4: Initialize Git Repository

### **4.1 Create Git Repository**

**Cursor AI Prompt:**
```
Initialize a Git repository for the AGORA project with proper .gitignore file that excludes:
- node_modules directories
- Build output directories
- Environment files (.env*)
- IDE specific files
- OS specific files (DS_Store, Thumbs.db)
- Supabase local files
- Log files

Create initial commit with the project structure.
```

### **4.2 Set Up Branch Strategy**

**Manual Commands:**
```bash
# Initialize git repository
git init

# Create initial commit
git add .
git commit -m "Initial project setup: monorepo structure with development tools"

# Create development branch
git checkout -b develop

# Create feature branch template
git checkout -b feature/project-setup
git checkout develop
```

### **4.3 Create GitHub Repository (Optional)**

If you want to use GitHub for version control:

```bash
# Add remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/agora-dev.git

# Push initial code
git push -u origin main
git push -u origin develop
```

---

## 📚 Step 5: Create Documentation Structure

### **5.1 Create Main README**

**Cursor AI Prompt:**
```
Create a comprehensive README.md file for the AGORA project that includes:
- Project description and purpose
- Installation and setup instructions
- Development workflow
- Architecture overview
- Contributing guidelines
- Links to detailed documentation

Make it beginner-friendly and include all necessary commands to get started.
```

### **5.2 Create Development Documentation**

**Cursor AI Prompt:**
```
Create the following documentation files in the docs/development/ directory:
1. GETTING_STARTED.md - Detailed setup instructions
2. ARCHITECTURE.md - High-level system architecture
3. CODING_STANDARDS.md - Code conventions and best practices
4. TROUBLESHOOTING.md - Common issues and solutions

Each file should be detailed and beginner-friendly.
```

### **5.3 Set Up Workspace Package Files**

**Cursor AI Prompt:**
```
Create package.json files for each workspace (frontend/, backend/, shared/) with:
- Appropriate names and descriptions
- Workspace-specific dependencies
- Development scripts
- Proper TypeScript configuration references

Do not install dependencies yet - just create the structure.
```

---

## 🔍 Step 6: Environment Configuration

### **6.1 Create Environment Templates**

**Cursor AI Prompt:**
```
Create environment template files:
1. .env.example in the root directory
2. .env.local.example in frontend directory  
3. .env.example in backend directory

Include all necessary environment variables for:
- Supabase configuration
- Microsoft authentication
- External API keys (placeholder values)
- Development settings

Include detailed comments explaining each variable.
```

### **6.2 Create Development Scripts**

**Cursor AI Prompt:**
```
Create development scripts in tools/scripts/ directory:
1. setup.sh - Complete project setup script
2. dev-start.sh - Start development environment
3. clean.sh - Clean build artifacts and node_modules
4. check-env.sh - Validate environment variables

Make scripts cross-platform compatible (Windows/Mac/Linux).
```

---

## ✅ Step 7: Verification and Testing

### **7.1 Install Dependencies**

Run these commands to install all dependencies:

```bash
# Install root dependencies
npm install

# Verify workspace structure
npm run setup

# Check TypeScript compilation
npx tsc --noEmit

# Run linting
npm run lint

# Check formatting
npm run format
```

### **7.2 Verify Project Structure**

**Cursor AI Prompt:**
```
Create a verification script that checks:
- All directories exist
- Package.json files are properly configured
- TypeScript compiles without errors
- Git repository is properly initialized
- All required files are present

Output a checklist of completed items.
```

### **7.3 Test Development Environment**

```bash
# Test concurrent development setup (should start without errors)
npm run dev

# Verify git status
git status

# Check branch structure
git branch -a
```

---

## 🎯 Completion Checklist

Before proceeding to **AGORA_DEV_02_DATABASE_SETUP**, verify all items:

### **Project Structure ✅**
- [ ] Monorepo directory structure created
- [ ] All workspace package.json files exist
- [ ] Root package.json configured for workspaces
- [ ] Git repository initialized with proper .gitignore

### **Development Tools ✅**
- [ ] TypeScript configuration files created
- [ ] ESLint configuration working
- [ ] Prettier configuration working
- [ ] Cursor AI rules file created
- [ ] Development scripts created

### **Documentation ✅**
- [ ] README.md file comprehensive and clear
- [ ] Development documentation created
- [ ] Environment templates created
- [ ] Coding standards documented

### **Environment ✅**
- [ ] Node.js 18+ installed and working
- [ ] Supabase CLI installed and accessible
- [ ] All npm dependencies installed successfully
- [ ] TypeScript compilation works without errors
- [ ] Linting and formatting work correctly

### **Verification ✅**
- [ ] `npm run dev` command exists (may not work yet)
- [ ] `npm run lint` passes
- [ ] `npm run format` works
- [ ] Git commits work properly
- [ ] All workspace references resolve correctly

---

## 🚨 Troubleshooting Common Issues

### **Issue: npm workspace commands not working**
```bash
# Solution: Ensure Node.js version 16+
node --version

# If older, update Node.js
```

### **Issue: TypeScript compilation errors**
```bash
# Solution: Check tsconfig.json paths
npx tsc --noEmit --listFiles
```

### **Issue: Git initialization problems**
```bash
# Solution: Re-initialize git
rm -rf .git
git init
```

### **Issue: Supabase CLI not found**
```bash
# Solution: Reinstall globally
npm uninstall -g supabase
npm install -g supabase
```

---

## 📋 Next Steps

Once you've completed ALL items in the checklist above:

1. **Commit your work:**
   ```bash
   git add .
   git commit -m "Complete project setup and environment configuration"
   ```

2. **Document any customizations** you made during setup

3. **Proceed to AGORA_DEV_02_DATABASE_SETUP.md** - This will guide you through setting up the Supabase database schema and migrations

---

## 📞 Support

If you encounter issues during setup:
1. Check the troubleshooting section above
2. Review the docs/development/TROUBLESHOOTING.md file
3. Ensure all prerequisites are properly installed
4. Verify your Node.js and npm versions

**Remember:** Complete this entire document before moving to the next one. Each subsequent document builds on the foundation established here.

---

**Document Status:** ✅ Ready for Implementation  
**Next Document:** AGORA_DEV_02_DATABASE_SETUP.md  
**Estimated Time:** 2-3 hours  
**Difficulty:** Beginner  
**Prerequisites:** Basic command line familiarity