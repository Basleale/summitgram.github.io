import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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

    // Fetch pin with tags and audio notes
    const { data: pin, error: pinError } = await supabase
      .from('pins')
      .select(
        `*,
        pin_tags(id, tag),
        pin_audio_notes(id, audio_url, created_at)`
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (pinError) throw pinError;

    return NextResponse.json(pin);
  } catch (error) {
    console.error('Fetch pin error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pin' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { x, y, description } = body;

    const { data: pin, error } = await supabase
      .from('pins')
      .update({
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(description !== undefined && { description }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(pin);
  } catch (error) {
    console.error('Update pin error:', error);
    return NextResponse.json(
      { error: 'Failed to update pin' },
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

    const { error } = await supabase
      .from('pins')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete pin error:', error);
    return NextResponse.json(
      { error: 'Failed to delete pin' },
      { status: 500 }
    );
  }
}
