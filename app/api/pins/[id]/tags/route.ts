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
    const { tag } = body;

    if (!tag) {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
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

    const { data: newTag, error } = await supabase
      .from('pin_tags')
      .insert({ pin_id: id, tag })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newTag);
  } catch (error) {
    console.error('Add tag error:', error);
    return NextResponse.json(
      { error: 'Failed to add tag' },
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
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
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
      .from('pin_tags')
      .delete()
      .eq('id', tagId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
