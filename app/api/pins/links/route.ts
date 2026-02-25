import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pin_id_a, pin_id_b } = body;

    if (!pin_id_a || !pin_id_b) {
      return NextResponse.json(
        { error: 'Both pin IDs are required' },
        { status: 400 }
      );
    }

    if (pin_id_a === pin_id_b) {
      return NextResponse.json(
        { error: 'Cannot link a pin to itself' },
        { status: 400 }
      );
    }

    // Verify both pins belong to the user
    const { data: pinA } = await supabase
      .from('pins')
      .select('id')
      .eq('id', pin_id_a)
      .eq('user_id', user.id)
      .single();

    const { data: pinB } = await supabase
      .from('pins')
      .select('id')
      .eq('id', pin_id_b)
      .eq('user_id', user.id)
      .single();

    if (!pinA || !pinB) {
      return NextResponse.json(
        { error: 'One or both pins not found' },
        { status: 404 }
      );
    }

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('pin_links')
      .select('id')
      .or(
        `and(pin_id_a.eq.${pin_id_a},pin_id_b.eq.${pin_id_b}),and(pin_id_a.eq.${pin_id_b},pin_id_b.eq.${pin_id_a})`
      )
      .single();

    if (existingLink) {
      return NextResponse.json(
        { error: 'Link already exists' },
        { status: 400 }
      );
    }

    const { data: link, error } = await supabase
      .from('pin_links')
      .insert({
        pin_id_a,
        pin_id_b,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(link);
  } catch (error) {
    console.error('Create link error:', error);
    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { linkId } = body;

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }

    // Get the link and verify pins belong to user
    const { data: link } = await supabase
      .from('pin_links')
      .select('pin_id_a, pin_id_b')
      .eq('id', linkId)
      .single();

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Verify both pins belong to user
    const { data: pinA } = await supabase
      .from('pins')
      .select('id')
      .eq('id', link.pin_id_a)
      .eq('user_id', user.id)
      .single();

    const { data: pinB } = await supabase
      .from('pins')
      .select('id')
      .eq('id', link.pin_id_b)
      .eq('user_id', user.id)
      .single();

    if (!pinA || !pinB) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this link' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('pin_links')
      .delete()
      .eq('id', linkId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete link error:', error);
    return NextResponse.json(
      { error: 'Failed to delete link' },
      { status: 500 }
    );
  }
}
