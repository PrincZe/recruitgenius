import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { questionText, answerText } = await req.json();

    if (!questionText || !answerText) {
      return NextResponse.json(
        { error: 'Question and answer text are required' }, 
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

    console.log(`Analyzing answer quality for question: "${questionText.substring(0, 50)}..."`);

    const prompt = `
You are an expert interview evaluator. Analyze how well the candidate's answer addresses the interview question.

Question: "${questionText}"

Answer: "${answerText}"

Provide your analysis in JSON format with the following fields:
- relevanceScore: Number from 1-10 indicating how directly the answer addresses the question
- completenessScore: Number from 1-10 indicating how thoroughly the question was answered
- clarityScore: Number from 1-10 indicating how clear and coherent the response is
- specificityScore: Number from 1-10 indicating how specific vs. generic the answer is
- overallScore: Number from 1-10 for the overall quality of the answer
- strengths: Array of strings describing 2-3 strengths of the answer
- weaknesses: Array of strings describing 1-2 areas for improvement
- summary: Brief evaluation summary (2-3 sentences)

Important: Return ONLY valid JSON, nothing else.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an AI assistant that provides interview answer evaluations in valid JSON format." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
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
    console.error('Error analyzing answer:', error);
    return NextResponse.json(
      { error: 'Error analyzing answer', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 