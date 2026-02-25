-- Create pins table
CREATE TABLE pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create pin_tags table
CREATE TABLE pin_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (pin_id) REFERENCES pins(id) ON DELETE CASCADE,
  UNIQUE(pin_id, tag_name)
);

-- Create pin_audio_notes table
CREATE TABLE pin_audio_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL,
  audio_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (pin_id) REFERENCES pins(id) ON DELETE CASCADE
);

-- Create pin_links table
CREATE TABLE pin_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_a_id UUID NOT NULL,
  pin_b_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (pin_a_id) REFERENCES pins(id) ON DELETE CASCADE,
  FOREIGN KEY (pin_b_id) REFERENCES pins(id) ON DELETE CASCADE,
  UNIQUE(pin_a_id, pin_b_id),
  CHECK (pin_a_id < pin_b_id)
);

-- Create indexes for performance
CREATE INDEX idx_pins_user_id ON pins(user_id);
CREATE INDEX idx_pin_tags_pin_id ON pin_tags(pin_id);
CREATE INDEX idx_pin_audio_notes_pin_id ON pin_audio_notes(pin_id);
CREATE INDEX idx_pin_links_pin_a_id ON pin_links(pin_a_id);
CREATE INDEX idx_pin_links_pin_b_id ON pin_links(pin_b_id);

-- Enable Row Level Security
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_audio_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own pins
CREATE POLICY pins_select_policy ON pins
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own pins
CREATE POLICY pins_insert_policy ON pins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own pins
CREATE POLICY pins_update_policy ON pins
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own pins
CREATE POLICY pins_delete_policy ON pins
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only read tags for their own pins
CREATE POLICY pin_tags_select_policy ON pin_tags
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pins WHERE pins.id = pin_tags.pin_id AND pins.user_id = auth.uid()
  ));

-- RLS Policy: Users can only insert tags for their own pins
CREATE POLICY pin_tags_insert_policy ON pin_tags
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pins WHERE pins.id = pin_id AND pins.user_id = auth.uid()
  ));

-- RLS Policy: Users can only delete tags for their own pins
CREATE POLICY pin_tags_delete_policy ON pin_tags
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM pins WHERE pins.id = pin_id AND pins.user_id = auth.uid()
  ));

-- RLS Policy: Users can only read audio notes for their own pins
CREATE POLICY pin_audio_notes_select_policy ON pin_audio_notes
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pins WHERE pins.id = pin_audio_notes.pin_id AND pins.user_id = auth.uid()
  ));

-- RLS Policy: Users can only insert audio notes for their own pins
CREATE POLICY pin_audio_notes_insert_policy ON pin_audio_notes
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pins WHERE pins.id = pin_id AND pins.user_id = auth.uid()
  ));

-- RLS Policy: Users can only delete audio notes for their own pins
CREATE POLICY pin_audio_notes_delete_policy ON pin_audio_notes
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM pins WHERE pins.id = pin_id AND pins.user_id = auth.uid()
  ));

-- RLS Policy: Users can only read links where they own both pins
CREATE POLICY pin_links_select_policy ON pin_links
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM pins WHERE pins.id = pin_a_id AND pins.user_id = auth.uid()) AND
    EXISTS (SELECT 1 FROM pins WHERE pins.id = pin_b_id AND pins.user_id = auth.uid())
  );

-- RLS Policy: Users can only insert links where they own both pins
CREATE POLICY pin_links_insert_policy ON pin_links
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM pins WHERE pins.id = pin_a_id AND pins.user_id = auth.uid()) AND
    EXISTS (SELECT 1 FROM pins WHERE pins.id = pin_b_id AND pins.user_id = auth.uid())
  );

-- RLS Policy: Users can only delete links where they own both pins
CREATE POLICY pin_links_delete_policy ON pin_links
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM pins WHERE pins.id = pin_a_id AND pins.user_id = auth.uid()) AND
    EXISTS (SELECT 1 FROM pins WHERE pins.id = pin_b_id AND pins.user_id = auth.uid())
  );
