import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { audio_url } = body;

    if (!audio_url) {
      return NextResponse.json(
        { error: 'Audio URL is required' },
        { status: 400 }
      );
    }

    // Verify pin belongs to user
    const { data: pin } = await supabase
      .from('pins')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 });
    }

    const { data: audioNote, error } = await supabase
      .from('pin_audio_notes')
      .insert({ pin_id: id, audio_url })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(audioNote);
  } catch (error) {
    console.error('Add audio note error:', error);
    return NextResponse.json(
      { error: 'Failed to add audio note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { audioId } = body;

    if (!audioId) {
      return NextResponse.json({ error: 'Audio ID is required' }, { status: 400 });
    }

    // Verify pin belongs to user first
    const { data: pin } = await supabase
      .from('pins')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('pin_audio_notes')
      .delete()
      .eq('id', audioId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete audio note error:', error);
    return NextResponse.json(
      { error: 'Failed to delete audio note' },
      { status: 500 }
    );
  }
}
