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

    const prompt = `
You are an expert talent evaluator with years of experience in technical recruiting for engineering managers. 
Your task is to analyze a candidate's resume against a job description for an engineering manager role, and provide a detailed evaluation.

The evaluation should assess the candidate against 5 dimensions of the engineering manager role:
1. Ownership - How well they take responsibility for team success and deliverables
2. Organisation Impact - How they influence across the organization and hire/develop others
3. Independence & Score - Their level of leadership and autonomous decision making
4. Strategic Alignment - Their ability to align with and influence company strategy
5. Skills - Their technical and managerial skill set

For each dimension, you'll assign:
- A score from 1.0 to 5.0 (with one decimal precision)
- A level from 4 to 8 that corresponds to their career progression
  * Level 4: Engineering Manager
  * Level 5: Senior Engineering Manager
  * Level 6: Engineering Director
  * Level 7: Senior Engineering Director
  * Level 8: Architecture & Capability Executive (ACE)

Job Description:
"""
${jobDescription}
"""

Candidate Resume:
"""
${resumeText}
"""

Return ONLY valid JSON in the following format:
{
  "overallScore": <number 1.0-5.0>,
  "dimensionScores": {
    "Ownership": {
      "score": <number 1.0-5.0>,
      "level": <integer 4-8>,
      "description": "<explanation of assessment>"
    },
    "Organisation Impact": {
      "score": <number 1.0-5.0>,
      "level": <integer 4-8>,
      "description": "<explanation of assessment>"
    },
    "Independence & Score": {
      "score": <number 1.0-5.0>,
      "level": <integer 4-8>,
      "description": "<explanation of assessment>"
    },
    "Strategic Alignment": {
      "score": <number 1.0-5.0>,
      "level": <integer 4-8>,
      "description": "<explanation of assessment>"
    },
    "Skills": {
      "score": <number 1.0-5.0>,
      "level": <integer 4-8>,
      "description": "<explanation of assessment>"
    }
  },
  "topStrengths": [<string>, <string>, <string>],
  "developmentAreas": [<string>, <string>],
  "skillsMatched": [<string>, <string>, <string>, ...],
  "summary": "<brief evaluation summary>"
}

Be objective, thorough, and focus on evidence from the resume. Do not make assumptions not supported by the resume.
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