import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all pins for the user
    const { data: pins, error } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(pins);
  } catch (error) {
    console.error('Fetch pins error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pins' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { image_url, description, x, y } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const { data: pin, error } = await supabase
      .from('pins')
      .insert({
        user_id: user.id,
        image_url,
        description: description || '',
        x: x || 0,
        y: y || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(pin);
  } catch (error) {
    console.error('Create pin error:', error);
    return NextResponse.json(
      { error: 'Failed to create pin' },
      { status: 500 }
    );
  }
}
