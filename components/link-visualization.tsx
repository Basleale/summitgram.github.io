'use client';

import React from 'react';

interface Pin {
  id: string;
  position_x: number;
  position_y: number;
}

interface Link {
  id: string;
  pin_a_id: string;
  pin_b_id: string;
}

interface LinkVisualizationProps {
  pins: Pin[];
  links: Link[];
  mousePos: { x: number; y: number };
}

const PIN_SIZE = 128; // Width of pin card

export default function LinkVisualization({
  pins,
  links,
  mousePos,
}: LinkVisualizationProps) {
  const getPinCenter = (pin: Pin) => {
    return {
      x: pin.position_x + PIN_SIZE / 2,
      y: pin.position_y + PIN_SIZE / 2,
    };
  };

  return (
    <>
      {links.map((link) => {
        const pinA = pins.find((p) => p.id === link.pin_a_id);
        const pinB = pins.find((p) => p.id === link.pin_b_id);

        if (!pinA || !pinB) return null;

        const start = getPinCenter(pinA);
        const end = getPinCenter(pinB);

        return (
          <line
            key={link.id}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="#c41e3a" /* Deep red for strings */
            strokeWidth="2"
            opacity="0.8"
            style={{
              filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))',
            }}
          />
        );
      })}
    </>
  );
}
