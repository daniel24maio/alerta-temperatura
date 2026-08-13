import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DeviceBadge } from '../src/components/DeviceBadge';

describe('Suíte de Testes do Frontend React (Vitest)', () => {
  it('Deve renderizar o badge Online corretamente', () => {
    render(<DeviceBadge status="online" lastSeen="2026-08-13T20:00:00.000Z" />);
    expect(screen.getByText(/Online/i)).toBeDefined();
  });

  it('Deve renderizar o badge Offline corretamente', () => {
    render(<DeviceBadge status="offline" lastSeen="2026-08-13T20:00:00.000Z" />);
    expect(screen.getByText(/Offline/i)).toBeDefined();
  });
});
