import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription, dimensions } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume text and job description are required' }, 
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OpenAI API key');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' }, 
        { status: 500 }
      );
    }

    console.log(`Analyzing resume against job description (first 50 chars): "${jobDescription.substring(0, 50)}..."`);

    // Construct the prompt for OpenAI
    const prompt = `
    You are an AI assistant specialized in evaluating resumes against job descriptions.

    JOB DESCRIPTION:
    ${jobDescription}

    RESUME TEXT:
    ${resumeText}

    Please analyze this resume against the job description and provide:

    1. FIRST, extract the candidate's full name and email address from the resume.
    2. Then evaluate the candidate on the following dimensions (score 1-10 and indicate level 4-8):
      - Ownership: ${dimensions[0]}
      - Organisation Impact: ${dimensions[1]}
      - Independence & Score: ${dimensions[2]}
      - Strategic Alignment: ${dimensions[3]}
      - Skills: ${dimensions[4]}
    3. Provide an overall score (1-100).
    4. Write a brief analysis of the candidate's fit for the role.

    Format your response as a valid JSON object with the following structure:
    {
      "candidateName": "Full Name",
      "candidateEmail": "email@example.com",
      "overallScore": 85,
      "dimensions": {
        "Ownership": { "score": 8, "level": 6, "justification": "..." },
        "OrganisationImpact": { "score": 7, "level": 5, "justification": "..." },
        "Independence": { "score": 9, "level": 7, "justification": "..." },
        "StrategicAlignment": { "score": 8, "level": 6, "justification": "..." },
        "Skills": { "score": 8, "level": 6, "justification": "..." }
      },
      "analysis": "Concise analysis of candidate's fit for the role...",
      "recommendedSkills": ["Skill 1", "Skill 2", "Skill 3"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an AI assistant that provides resume evaluations against job descriptions in valid JSON format." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    // Extract the JSON from the response
    let analysisData;
    try {
      // Try to parse the whole response as JSON
      analysisData = JSON.parse(responseText);
    } catch (e) {
      // If that fails, try to extract JSON using regex
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisData = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('Failed to parse JSON from response:', e2);
          return NextResponse.json(
            { error: 'Failed to parse analysis results', rawResponse: responseText }, 
            { status: 500 }
          );
        }
      } else {
        console.error('No JSON found in response');
        return NextResponse.json(
          { error: 'No analysis results found', rawResponse: responseText }, 
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      analysis: analysisData
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json(
      { error: 'Error analyzing resume', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 