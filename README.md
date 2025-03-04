# RecruitGenius - AI Interview Platform

RecruitGenius is an AI-powered interview platform that allows candidates to answer interview questions presented in audio format. The platform records the candidate's audio response, transcribes it to text, and provides a dashboard for hiring managers to review candidate responses.

## Features

- Text-to-speech question presentation
- Audio recording of candidate responses
- Real-time transcription using Deepgram
- Admin dashboard for reviewing candidate responses
- Simple "fake" login system for demo purposes

## Demo Implementation Details

This demo version uses browser localStorage to store:
- Candidate information
- Interview questions
- Session progress
- Audio recordings (as base64 strings)
- Transcriptions

**Note:** In a production environment, this data would be stored in a secure database with proper authentication and authorization.

## Deployment to Vercel

### Prerequisites

- A [Vercel](https://vercel.com) account
- A [GitHub](https://github.com) account

### Deployment Steps

1. **Fork or Push to GitHub**
   - Fork this repository or push your local copy to a new GitHub repository

2. **Connect to Vercel**
   - Log in to your Vercel account
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: next build
     - Output Directory: .next

3. **Add Environment Variables**
   - Add the following environment variables in the Vercel project settings:
     - OPENAI_API_KEY=your_openai_key
     - DEEPGRAM_API_KEY=your_deepgram_key

4. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete
   - Your application will be available at the provided Vercel URL

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with the required environment variables:
   ```
   OPENAI_API_KEY=your_openai_key
   DEEPGRAM_API_KEY=your_deepgram_key
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Future Enhancements

- Integration with Supabase for persistent storage
- Real authentication system
- Enhanced analytics for interview responses
- AI-powered feedback on candidate responses

## License

MIT
