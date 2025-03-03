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