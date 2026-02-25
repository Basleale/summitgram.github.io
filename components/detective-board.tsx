'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import PinCard from './pin-card';
import PinDetailsModal from './pin-details-modal';
import LinkVisualization from './link-visualization';
import ContextMenu from './context-menu';

interface Pin {
  id: string;
  image_url: string;
  description?: string;
  position_x?: number;
  position_y?: number;
  x?: number;
  y?: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  audioNotes?: any[];
}

interface Link {
  id: string;
  pin_a_id: string;
  pin_b_id: string;
}

interface DetectiveBoardProps {
  pins: Pin[];
  links: Link[];
  onPinsUpdate: (pins: Pin[]) => void;
  onLinksUpdate: (links: Link[]) => void;
}

export default function DetectiveBoard({
  pins,
  links,
  onPinsUpdate,
  onLinksUpdate,
}: DetectiveBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggingPin, setDraggingPin] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    pinId: string;
    x: number;
    y: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const longPressTimeoutRef = useRef<NodeJS.Timeout>();
  const supabaseRef = useRef(createClient());

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    if (draggingPin && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const updatedPins = pins.map((pin) => {
        if (pin.id === draggingPin) {
          return {
            ...pin,
            position_x: e.clientX - rect.left,
            position_y: e.clientY - rect.top,
          };
        }
        return pin;
      });
      onPinsUpdate(updatedPins);
    }
  }, [draggingPin, pins, onPinsUpdate]);

  const handleMouseUp = useCallback(async () => {
    if (draggingPin) {
      const pin = pins.find((p) => p.id === draggingPin);
      if (pin) {
        // Save position to database
        try {
          const supabase = supabaseRef.current;
          await supabase
            .from('pins')
            .update({
              x: pin.position_x,
              y: pin.position_y,
            })
            .eq('id', draggingPin);
        } catch (error) {
          console.error('Error updating pin position:', error);
        }
      }
      setDraggingPin(null);
    }
  }, [draggingPin, pins]);

  const handleContextMenu = (
    e: React.MouseEvent,
    pinId: string
  ) => {
    e.preventDefault();
    setContextMenu({
      pinId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleLinkPin = async (targetPinId: string) => {
    if (!contextMenu) return;

    const pin1Id = contextMenu.pinId;
    const pin2Id = targetPinId;

    // Check if link already exists
    const linkExists = links.some(
      (l) =>
        (l.pin_a_id === pin1Id && l.pin_b_id === pin2Id) ||
        (l.pin_a_id === pin2Id && l.pin_b_id === pin1Id)
    );

    if (linkExists) {
      setContextMenu(null);
      return;
    }

    // Create new link
    try {
      const supabase = supabaseRef.current;
      const { data: newLink, error } = await supabase
        .from('pin_links')
        .insert({
          pin_a_id: pin1Id,
          pin_b_id: pin2Id,
        })
        .select()
        .single();

      if (!error && newLink) {
        onLinksUpdate([...links, newLink]);
      }
    } catch (error) {
      console.error('Error creating link:', error);
    }
    setContextMenu(null);
  };

  const handleUnlink = async (linkId: string) => {
    try {
      const supabase = supabaseRef.current;
      await supabase.from('pin_links').delete().eq('id', linkId);
      onLinksUpdate(links.filter((l) => l.id !== linkId));
    } catch (error) {
      console.error('Error unlinking:', error);
    }
  };

  const handleUnpin = async (pinId: string) => {
    try {
      const supabase = supabaseRef.current;
      await supabase.from('pins').delete().eq('id', pinId);
      onPinsUpdate(pins.filter((p) => p.id !== pinId));
    } catch (error) {
      console.error('Error unpinning:', error);
    }
  };

  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
    setShowDetails(true);
  };

  useEffect(() => {
    if (draggingPin) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp as any);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp as any);
      };
    }
  }, [draggingPin, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={boardRef}
      className="relative w-full h-full bg-background overflow-auto"
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.02) 2px,
            rgba(0, 0, 0, 0.02) 4px
          ),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.02) 2px,
            rgba(0, 0, 0, 0.02) 4px
          )
        `,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* SVG for links */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <LinkVisualization
          pins={pins}
          links={links}
          mousePos={mousePos}
        />
      </svg>

      {/* Pins */}
      {pins.map((pin) => (
        <div
          key={pin.id}
          className="absolute cursor-move select-none touch-none"
          style={{
            left: `${pin.position_x}px`,
            top: `${pin.position_y}px`,
          }}
          onMouseDown={() => setDraggingPin(pin.id)}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              setDraggingPin(pin.id);
              // Long press for context menu on mobile
              longPressTimeoutRef.current = setTimeout(() => {
                const touch = e.touches[0];
                setContextMenu({
                  pinId: pin.id,
                  x: touch.clientX,
                  y: touch.clientY,
                });
              }, 500);
            }
          }}
          onTouchEnd={() => {
            if (longPressTimeoutRef.current) {
              clearTimeout(longPressTimeoutRef.current);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, pin.id)}
          onDoubleClick={() => handlePinClick(pin)}
          onClick={() => handlePinClick(pin)}
        >
          <PinCard
            pin={pin}
            links={links}
            onLinkClick={(targetPinId) => handleLinkPin(targetPinId)}
            onUnlink={handleUnlink}
            onUnpin={handleUnpin}
            contextMenuOpen={contextMenu?.pinId === pin.id}
          />
        </div>
      ))}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          pinId={contextMenu.pinId}
          x={contextMenu.x}
          y={contextMenu.y}
          pins={pins}
          onLinkPin={handleLinkPin}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Details Modal */}
      {showDetails && selectedPin && (
        <PinDetailsModal
          pin={selectedPin}
          onClose={() => setShowDetails(false)}
          onUpdate={async () => {
            // Pins will auto-update from page
          }}
          onUnpin={handleUnpin}
        />
      )}
    </div>
  );
}
