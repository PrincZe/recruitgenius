# Recruitment Tool MVP: Prioritized Task List & Implementation Guide

**Overall Goals:**

*   Develop a Next.js application (using the App Router) that allows candidates to answer interview questions presented in audio format.
*   Record the candidate's audio response.
*   Transcribe the audio response to text.
*   Provide a dashboard for hiring managers to review candidate responses (audio and transcript).
*   **Focus on:** Core functionality and a smooth, intuitive user experience for candidates.
*   **Non-Goals:** Authentication is not required for this MVP.

**Implementation Approach (Guiding Principles):**

*   **Start Small:** Begin with a single question flow to test core audio functionality.
*   **Progressive Enhancement:** Add features incrementally, ensuring each component works before moving on.
*   **Use Serverless Functions:** Leverage Next.js API routes for backend processing.
*   **Prioritize UX:** Focus on making the audio recording experience smooth and intuitive for candidates.
*   **Client-Side Processing:** Handle as much audio processing in the browser as possible to reduce server load.
*   **Separate Concerns:** Build modular components that handle specific tasks (playback, recording, storage).

**Technical Considerations:**

*   Use browser-native APIs when possible (MediaRecorder, Web Speech API).
*   Consider fallbacks for browsers with limited audio support.
*   Implement graceful error handling for critical issues (like microphone access denied).
*   Optimize audio file size for storage and processing efficiency (e.g., .mp3 or .wav).
*   Ensure proper cleanup of media streams after recording completes.
*   Ensure data is passed from the back end to the front end for use.

---

## Phase 1: Core Audio Functionality (Build First)

*   **Task 1: Set up Next.js project with App Router**
    *   Create basic project structure
    *   Set up essential pages (e.g., `/interview`, `/admin`)
*   **Task 2: Data Structure for Questions**
    *   Define a basic data structure for storing interview questions. This structure should include a unique ID for each question.
*   **Task 3: Implement Text-to-Speech Functionality**
    *   Integrate Web Speech API or a similar TTS service (explore options like Google Cloud Text-to-Speech, AssemblyAI, etc. if Web Speech API is insufficient). Decide on client-side vs. server-side.
    *   Create component to play question audio
    *   Test audio playback functionality
*   **Task 4: Build Audio Recording Capability**
    *   Implement MediaRecorder API integration
    *   Create recording UI with start/stop controls
    *   Add visual recording indicator (timer/waveform)
    *   Test microphone access and recording
*   **Task 5: Create Basic Data Storage**
    *   Set up a simple data storage system for storing the recorded audio data temporarily, and permanently
    *   Set up simple database structure for questions and responses
    *   Implement API endpoints for saving recordings
    *   Configure cloud storage for audio files

---

## Phase 2: Candidate Assessment Flow

*   **Task 6: Develop Candidate-Facing Interface**
    *   Create assessment page with clear instructions
    *   Implement question playback flow using the TTS functionality
    *   Build recording interface with review capability (e.g., ability to replay their recording)
    *   Add navigation between questions
*   **Task 7: Enable Audio Processing Pipeline**
    *   Implement audio file upload to storage
    *   Connect recording component to storage API
    *   Create unique session IDs for candidate attempts (even though auth isn't required, this helps organize data)
*   **Task 8: Integrate Speech-to-Text Functionality**
    *   Set up transcription service API connection (AssemblyAI, Google Cloud Speech-to-Text, Deepgram)
    *   Process recorded audio through transcription API
    *   Store transcriptions alongside recordings in the data storage system, ensure the audio file location is kept.
*   **Task 9: Data Connections**
    *   Ensure the necessary keys, the candidate ID, audio location and question are saved.

---

## Phase 3: Admin Interface

*   **Task 10: Build Question Management System**
    *   Create interface for adding/editing questions (form fields, etc.)
    *   Implement question preview with TTS test
    *   Generate unique assessment links for candidates (for easy sharing/access)
*   **Task 11: Develop Review Dashboard**
    *   Create dashboard to list all candidate responses
    *   Add audio playback controls for reviewing responses
    *   Display transcriptions alongside questions
    *   Implement simple evaluation tools (e.g., a notes field to save notes per recording)
*   **Task 12: Connecting dashboard to the data.**
    *   Ensure that you can connect your keys and bring into the interface and that it shows everything that needs to be shown on the dashboard.

---

## Phase 4: Resume Screening Feature (New)

*   **Task 13: Set up Database Schema for Resume Screening**
    *   Create job_postings table with fields for title, description, requirements
    *   Create resumes table to store uploaded resume files and metadata
    *   Create resume_evaluations table to store analysis results
    *   Add necessary columns to existing tables (has_resume, resume_id, job_posting_id)
    *   Set up evaluation_criteria table to store the 5-dimension evaluation matrix

*   **Task 14: Create Storage Infrastructure**
    *   Set up Supabase storage bucket for job descriptions
    *   Set up Supabase storage bucket for candidate resumes
    *   Create utility functions for file upload and retrieval

*   **Task 15: Implement Admin Screening Page**
    *   Build job description filter interface
    *   Create resume upload functionality with progress indicator
    *   Implement file validation (PDF only, size limits)
    *   Design UX flow for submission and analysis

*   **Task 16: Develop Resume Analysis API**
    *   Create API route for OpenAI analysis of resumes against job descriptions
    *   Implement extraction of text from PDF resumes
    *   Design prompt engineering for accurate resume evaluation
    *   Structure the 5-dimension scoring system (Ownership, Organisation Impact, etc.)
    *   Map OpenAI analysis to the level system (4-8)

*   **Task 17: Build Candidate Dashboard**
    *   Create interface for viewing candidates with their scores
    *   Implement multi-select functionality for candidates
    *   Add "Send to Voice Interview" button with link generation
    *   Design UI for displaying the 5-dimension evaluation results
    *   Include sorting and filtering options

*   **Task 18: Integrate with Existing Voice Interview Flow**
    *   Connect selected candidates to interview session creation
    *   Pass job posting context to interview sessions
    *   Update voice interview UI to acknowledge resume screening context

*   **Task 19: Comprehensive Evaluation View**
    *   Create unified view of both resume and voice interview scores
    *   Implement visualization of the 5-dimension evaluation
    *   Add comparative analysis between candidates

*   **Task 20: Data Population and Testing**
    *   Upload and configure the Engineering Manager job description
    *   Populate evaluation criteria from the provided matrix
    *   Test the end-to-end flow with sample resumes

---

## Environment Variables

*   OPENAI_API_KEY=your_openai_key
*   DEEPGRAM_API_KEY=your_deepgram_key
*   FIREBASE_API_KEY=your_firebase_key
*   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
*   FIREBASE_PROJECT_ID=your_firebase_project_id
*   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
*   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
*   FIREBASE_APP_ID=your_firebase_app_id

---

## Changelog: Voice Recording Improvements (2025-03-04)

### Issues Addressed:
1. Recordings not properly associated with specific questions when navigating between them
2. Audio playback issues in different browsers
3. State management problems with recordings
4. Missing error handling for recording and playback failures
5. No session recovery functionality 
6. UI/UX issues with recording display

### Components Updated:

#### 1. VoiceRecorder Component (`src/components/VoiceRecorder.tsx`):
- Added tracking of the current question ID using a ref to detect question changes
- Implemented proper cleanup of MediaRecorder and audio resources when unmounting or changing questions
- Added comprehensive error handling for recording, saving, and playback
- Improved browser compatibility by trying multiple audio formats (webm, mp4, ogg, wav)
- Added fallback mechanisms for audio playback (trying base64 version if URL blob fails)
- Enhanced UI with better visual feedback during recording
- Added proper metadata to recorded audio to associate with specific questions
- Implemented local storage for saving recordings with proper question and candidate IDs
- Added audio error display with option to re-record

#### 2. InterviewForm Component (`src/components/InterviewForm.tsx`):
- Added state for tracking the current recording for each question
- Implemented useEffect to update the current recording when question changes
- Added key props to VoiceRecorder and audio elements to force proper re-rendering
- Improved navigation between questions with cleaner state management
- Added progress indicators to show which questions have been completed
- Enhanced UI with animations for question transitions

#### 3. New Component: InterviewSessionRecovery (`src/components/InterviewSessionRecovery.tsx`):
- Created a new component to handle session recovery
- Implemented detection of existing recordings in localStorage
- Added UI for prompting users to continue a previous session or start new
- Added functionality to clear session data when starting new

### Current Status:
- ✅ Phase 1 (Core Audio Functionality): Complete
- ✅ Task 4 (Build Audio Recording Capability): Significantly improved with robust error handling
- ✅ Task 6 (Develop Candidate-Facing Interface): Enhanced with better UX for recording
- ✅ Task 9 (Data Connections): Improved with proper association of recordings to questions

### Next Steps:
- Implement Firebase integration for permanent storage of recordings beyond localStorage
- Enhance the dashboard for hiring managers to review all candidate responses
- Add functionality to export interview results and transcripts
- Implement more advanced transcription options with Deepgram

### Technical Notes:
- The application now properly handles recordings for each question independently
- Audio compatibility has been improved across browsers
- Session management allows candidates to resume interviews
- Error handling has been added at multiple levels for a more robust user experience

---

## Changelog: Migration from localStorage to Supabase (2025-03-05)

### Issues Addressed:
1. Data persistence limited by localStorage constraints
2. No centralized storage for recordings and candidate information
3. Admin dashboard unable to access recordings from different devices
4. Recordings lost when browser data is cleared
5. Limited scalability for larger applications

### Components Updated:

#### 1. VoiceRecorder Component (`src/components/VoiceRecorder.tsx`):
- Integrated with Supabase Storage for saving audio recordings
- Added functionality to upload audio files to Supabase
- Implemented proper metadata association with recordings
- Added fallback to localStorage during migration period
- Enhanced error handling for Supabase operations
- Improved audio playback from Supabase URLs

#### 2. InterviewForm Component (`src/components/InterviewForm.tsx`):
- Updated to fetch recordings from Supabase instead of localStorage
- Added fallback mechanisms for backward compatibility
- Enhanced state management for recordings
- Improved loading states and error handling
- Added proper session management with Supabase

#### 3. Admin Dashboard (`src/app/admin/page.tsx` and related components):
- Updated to fetch candidates, questions, and recordings from Supabase
- Implemented proper data refresh functionality
- Enhanced UI with better loading states and error handling
- Improved audio playback for recordings stored in Supabase

#### 4. Interview Start Page (`src/app/interview/page.tsx`):
- Updated to create candidates and sessions in Supabase
- Enhanced form for collecting candidate information
- Improved error handling and loading states
- Added proper session management

#### 5. Supabase Services:
- Implemented comprehensive data services for Supabase operations
- Added functions for managing candidates, questions, sessions, and recordings
- Implemented proper error handling and data validation
- Added utilities for working with Supabase Storage

### Current Status:
- ✅ Phase 1 (Core Audio Functionality): Complete
- ✅ Phase 2 (Candidate Assessment Flow): Complete with Supabase integration
- ✅ Phase 3 (Admin Interface): Complete with Supabase integration
- ✅ Task 5 (Create Basic Data Storage): Updated to use Supabase instead of localStorage
- ✅ Task 7 (Enable Audio Processing Pipeline): Enhanced with Supabase Storage
- ✅ Task 12 (Connecting dashboard to the data): Completed with Supabase integration

### Technical Notes:
- The application now uses Supabase for all data storage needs
- Fallback mechanisms to localStorage are in place for backward compatibility
- Audio recordings are stored in Supabase Storage with proper metadata
- Admin dashboard can now access all recordings from a central database
- Candidate information is properly stored and associated with recordings
- Questions can be managed through the admin interface and stored in Supabase

---

## Changelog: Simplified Recording and Improved Reliability (2025-03-06)

### Issues Addressed:
1. Recording functionality stopping immediately with empty audio blobs (0 bytes)
2. Deepgram integration causing complexity and potential reliability issues
3. Type mismatches between components causing build errors
4. Browser compatibility issues with audio recording
5. Lack of clear error feedback for recording failures

### Components Updated:

#### 1. VoiceRecorder Component (`src/components/VoiceRecorder.tsx`):
- Simplified the component to focus solely on recording and Supabase storage
- Separated recording from transcription to follow the "separate concerns" principle
- Improved MediaRecorder implementation with better MIME type detection and fallbacks
- Added comprehensive error handling for all stages of the recording process
- Enhanced audio chunk collection (set to capture data every second)
- Implemented proper validation of audio blobs before saving
- Added detailed logging for debugging recording issues
- Improved visual feedback for recording states and errors
- Enhanced cleanup of media resources to prevent memory leaks

#### 2. InterviewQuestionsClient Component (`src/app/interview/[sessionId]/InterviewQuestionsClient.tsx`):
- Updated the handleRecordingComplete function to accept nullable transcript property
- Fixed type compatibility issues between components
- Improved session progress tracking
- Enhanced localStorage interaction for offline scenarios

### Current Status:
- ✅ Phase 1 (Core Audio Functionality): Complete with improved reliability
- ✅ Task 4 (Build Audio Recording Capability): Significantly enhanced with robust error handling
- ✅ Task 5 (Create Basic Data Storage): Focused on Supabase integration
- ✅ Task 7 (Enable Audio Processing Pipeline): Simplified for better reliability

### Technical Notes:
- The application now separates recording from transcription, following the "progressive enhancement" principle
- Audio recording has been made more reliable across different browsers
- Error handling provides clear feedback on issues like microphone access denial, empty recordings, etc.
- The solution is designed to be extended later with separate transcription functionality
- Recording data is saved to both Supabase Storage and localStorage (as fallback)

### Next Steps:
- Implement a separate transcription system using Deepgram at a later stage
- Create a dedicated transcription view/component for processing saved recordings
- Enhance the admin dashboard to support both audio review and transcription review
- Consider implementing batch transcription for archived recordings

## Changelog: Fixed Supabase Recording Retrieval Issues (2025-03-07)

### Issues Addressed:
1. Recordings visible in Supabase Storage but not appearing in the admin dashboard
2. Missing database entries for uploaded audio files in the recordings table
3. Inconsistent candidate ID persistence across browser sessions
4. Inability to retrieve previous recordings after starting a new session
5. Disconnect between storage files and database records

### Components Updated:

#### 1. VoiceRecorder Component (`src/components/VoiceRecorder.tsx`):
- Fixed the recording save process to properly insert records into the Supabase recordings table
- Updated column naming to match database schema (`audio_url` instead of `audioUrl`)
- Added validation to ensure valid candidate ID before recording or saving
- Added comprehensive error logging to diagnose issues with Supabase operations
- Improved filename generation with random strings to prevent collisions
- Enhanced metadata association with recordings for proper retrieval

#### 2. InterviewForm Component (`src/components/InterviewForm.tsx`):
- Implemented persistent candidate ID storage using `persistentCandidateId` in localStorage
- Modified the `loadRecordings` function to use the persistent ID for retrieval
- Improved error handling for cases when no valid candidate ID is found
- Enhanced session management to maintain consistent identity across browser sessions

#### 3. Admin Dashboard (`src/app/admin/page.tsx`):
- Added direct Supabase database querying, bypassing service layer for more reliable retrieval
- Implemented proper mapping between database columns and application model properties
- Added auto-refresh functionality to periodically update the dashboard data
- Enhanced error handling and loading states for better user experience
- Added debug functionality to help diagnose Supabase connection issues
- Implemented a "Sync Storage Files" feature to create database entries for existing storage files

#### 4. RecordingsTab Component (`src/components/admin/RecordingsTab.tsx`):
- Added candidate filtering functionality to filter recordings by candidate
- Improved audio element error handling to gracefully handle missing files
- Enhanced the UI with better error states for audio playback issues

#### 5. Supabase Service (`src/lib/services/supabaseService.ts`):
- Added better error handling and logging for database operations
- Enhanced `getRecordings` and `getRecordingsByCandidate` functions for more reliable retrieval
- Implemented `addRecording` function with proper error handling and consistent data format

### Current Status:
- ✅ Phase 2 (Candidate Assessment Flow): Improved with reliable data persistence
- ✅ Phase 3 (Admin Interface): Enhanced with robust data retrieval
- ✅ Task 5 (Create Basic Data Storage): Fixed issues with Supabase integration
- ✅ Task 7 (Enable Audio Processing Pipeline): Improved reliability of storage operations
- ✅ Task 12 (Connecting dashboard to the data): Resolved data retrieval issues

### Technical Notes:
- The application now correctly associates recordings with candidates across sessions
- Database entries are properly created for all recordings saved to storage
- The admin dashboard can now reliably display recordings from previous sessions
- The "Sync Storage Files" feature allows recovery of recordings that were previously missing database entries
- Improved logging and debugging tools help diagnose any future issues
- Candidate filtering provides better organization of recordings in the admin dashboard

## Changelog: Enhanced Transcription with Advanced Analysis Features (2025-03-08)

### Features Added:
1. Speech-to-text transcription of candidate recordings using Deepgram
2. Sentiment analysis of candidate responses (positive, negative, neutral)
3. Automated summary generation for candidate answers
4. Topic detection to identify key subjects in responses
5. Answer quality analysis to evaluate responses against questions

### Components Updated:

#### 1. Database Schema:
- Added new columns to the recordings table:
  - `transcript` (TEXT) - For storing transcribed text
  - `sentiment_score` (FLOAT) - For storing sentiment analysis score (-1 to 1)
  - `sentiment_type` (TEXT) - For storing sentiment classification (positive/negative/neutral)
  - `is_processed` (BOOLEAN) - Flag to track processed recordings
  - `summary` (TEXT) - For storing generated summaries
  - `topics` (JSONB) - For storing detected topics with confidence scores

#### 2. API Endpoints:
- Created `/api/deepgram/transcribe` - Handles speech-to-text, sentiment, summarization, and topic detection
- Created `/api/recordings/process` - Processes recordings and updates database with analysis results
- Created `/api/openai/analyze-answer` - Evaluates answer quality against interview questions

#### 3. Admin Dashboard (`src/app/admin/page.tsx`):
- Enhanced candidate modal to display transcripts, summaries, and topics
- Added sentiment indicators to recording entries
- Added auto-refresh toggle to prevent disrupting filters
- Improved candidate filtering with persistent state

#### 4. Recording Detail Page (`src/app/admin/recordings/[id]/RecordingDetailClient.tsx`):
- Added "Process Recording" button to trigger transcription and analysis
- Added transcript display with sentiment analysis visualization
- Added summary section with concise response overview
- Added topic tags with confidence scores
- Added answer quality analysis with detailed scoring and evaluation

### Current Status:
- ✅ Phase 1 (Core Audio Functionality): Complete
- ✅ Phase 2 (Candidate Assessment Flow): Complete
- ✅ Phase 3 (Admin Interface): Enhanced with advanced analysis features
- ✅ Task 8 (Integrate Speech-to-Text Functionality): Complete with Deepgram integration
- ✅ Task 11 (Develop Review Dashboard): Enhanced with rich analysis features

### Technical Notes:
- Deepgram API is used for transcription, sentiment analysis, summarization, and topic detection
- OpenAI is used for evaluating answer quality against interview questions
- Analysis results are stored in Supabase for easy retrieval and review
- The solution offers multiple levels of insight into candidate responses
- The admin dashboard now provides rich data for better candidate evaluation

### Next Steps:
- Consider implementing batch processing for multiple recordings
- Explore integration with ATS (Applicant Tracking Systems)
- Add comparative analysis between candidates
- Add export functionality for analysis results

## Changelog: Resume Screening Feature Implementation (2025-03-10)

### Features to Implement:
1. Resume screening against job descriptions using OpenAI
2. Five-dimension evaluation framework (Ownership, Organisation Impact, Independence & Score, Strategic Alignment, Skills)
3. Job posting management
4. Resume upload and processing
5. Candidate selection for voice interviews
6. Integrated dashboard for resume and voice scores

### Data Structure Updates:
1. New tables:
   - job_postings - For storing job titles and descriptions
   - resumes - For storing uploaded resume files and metadata
   - resume_evaluations - For storing analysis results
   - evaluation_criteria - For storing the 5-dimension evaluation matrix
2. New columns:
   - has_resume and resume_id in candidates table
   - job_posting_id in sessions table
3. New storage buckets:
   - job_postings - For storing job description PDFs
   - resumes - For storing candidate resume PDFs

### Technical Implementation Plan:
1. SQL migrations to create new tables and columns
2. Upload and storage utilities for PDFs
3. Text extraction from PDFs for analysis
4. OpenAI integration for resume analysis
5. UI for screening workflow
6. Dashboard for candidate evaluation
7. Integration with existing voice interview system

### Next Steps:
- Create and execute SQL migration scripts
- Implement file upload handlers for PDFs
- Develop the resume screening page with job description filtering
- Build the candidate dashboard with selection functionality
- Create the OpenAI analysis API for resume evaluation