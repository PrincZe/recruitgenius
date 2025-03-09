# Resume Screening Feature Implementation

This document outlines the resume screening features implemented for the recruitment tool.

## Overview

The resume screening feature allows recruiters to:
- Upload and analyze candidate resumes against job descriptions
- Evaluate candidates on 5 key dimensions for engineering management
- Select promising candidates for voice interviews
- Generate interview links for candidates
- View detailed analysis of each candidate's resume

## Technical Components

### Database & Storage

1. **New Tables:**
   - `job_postings` - Stores job titles, descriptions, skills, and requirements
   - `resumes` - Stores uploaded resume files and extracted text
   - `resume_evaluations` - Stores analysis results and evaluation scores
   - `evaluation_criteria` - Stores the 5-dimension evaluation matrix

2. **Storage Buckets:**
   - `job_postings` - For storing job description PDFs
   - `resumes` - For storing candidate resume PDFs

### UI Components

1. **Admin Screening Page (`src/app/admin/screening/page.tsx`)**
   - Job description selection
   - Resume upload interface with drag-and-drop
   - Real-time upload progress tracking
   - Initial analysis results display

2. **ResumeUploader Component (`src/components/resume/ResumeUploader.tsx`)**
   - Multi-file PDF upload with validation
   - Text extraction from PDFs
   - File validation (PDF only, size limits)
   - Progress indicators

3. **Candidates Dashboard (`src/app/admin/candidates/page.tsx`)**
   - List of candidates with their evaluation scores
   - Multi-select functionality
   - Interview link generation
   - Sorting and filtering

4. **Candidate Detail Page (`src/app/admin/candidates/[id]/page.tsx`)**
   - Detailed view of candidate's evaluation
   - Dimension scores visualization
   - Analysis summary and strengths/weaknesses
   - Skills matching display

### Services & APIs

1. **Resume Service (`src/lib/services/resumeService.ts`)**
   - Functions for analyzing resumes with OpenAI
   - Methods for fetching and storing evaluation data
   - Mock data generation for development

2. **OpenAI Integration (`src/app/api/openai/analyze-resume/route.ts`)**
   - API endpoint to analyze resumes against job descriptions
   - 5-dimension scoring (Ownership, Organisation Impact, Independence, Strategic Alignment, Skills)
   - Levels 4-8 mapping for engineering management progression

3. **PDF Utilities (`src/lib/utils/pdfUtils.ts`)**
   - Text extraction from PDF files
   - PDF preview generation

## Dimension Evaluation Framework

The system evaluates candidates on 5 key dimensions, each mapped to levels 4-8:

1. **Ownership**
   - How well they take responsibility for team success and deliverables
   - Levels from "Guide others" (4) to "Long-term vision" (8)

2. **Organisation Impact**
   - How they influence across the organization and hire/develop others
   - Levels from "Help other teams" (4) to "Culture stewardship" (8)

3. **Independence & Score**
   - Their level of leadership and autonomous decision making
   - Levels from "Team thought leader" (4) to "Industry thought leader" (8)

4. **Strategic Alignment**
   - Their ability to align with and influence company strategy
   - Levels from "Quarterly goals" (4) to "Industry direction" (8)

5. **Skills**
   - Their technical and managerial skill set
   - Levels from "Technical mentorship" (4) to "Transformational leadership" (8)

## Integration with Voice Interview System

The resume screening feature integrates with the existing voice interview system:

1. Recruiters can select promising candidates from the screening results
2. The system generates unique interview links for selected candidates
3. Candidates receive links to complete voice interviews
4. Results from both resume screening and voice interviews are displayed in a unified dashboard

## Next Steps & Potential Enhancements

1. **PDF Processing Improvements**
   - Replace placeholder PDF text extraction with proper pdf.js integration
   - Implement more robust text parsing and formatting

2. **AI Analysis Refinement**
   - Tune OpenAI prompts for more accurate evaluations
   - Add more specific evaluation criteria based on job roles

3. **User Experience Enhancements**
   - Add batch processing for multiple resumes
   - Implement more advanced filtering and sorting
   - Add candidate comparison views

4. **Integration Opportunities**
   - Connect with external ATS systems for seamless data flow
   - Add email notification system for interview invitations
   - Implement calendar integration for scheduling interviews 