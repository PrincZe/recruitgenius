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