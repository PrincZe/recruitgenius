import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { id, status, remarks } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Evaluation ID is required' }, { status: 400 });
    }

    // Create the update object with only provided fields
    const updateData: { status?: string; remarks?: string } = {};
    if (status !== undefined) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;

    // Update the resume evaluation
    const { data, error } = await supabase
      .from('resume_evaluations')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating evaluation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in update route:', error);
    return NextResponse.json(
      { error: 'Failed to update evaluation' }, 
      { status: 500 }
    );
  }
} 