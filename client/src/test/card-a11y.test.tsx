import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from '../components/game/Card';

// Mock useGameStore
vi.mock('../../stores/useGameStore', () => ({
  useGameStore: () => 'chkobba',
}));

// Mock framer-motion to render plain divs
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      // Strip framer-motion-specific props
      const {
        whileHover, animate, initial, exit, transition,
        dangerouslySetInnerHTML, layout, ...htmlProps
      } = props;
      if (dangerouslySetInnerHTML) {
        return <div {...htmlProps} dangerouslySetInnerHTML={dangerouslySetInnerHTML} />;
      }
      return <div {...htmlProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock cardUtils
vi.mock('../../lib/cardUtils', () => ({
  generateCardSVG: (rank: string, suit: string) =>
    `<svg data-testid="card-svg">${rank}-${suit}</svg>`,
  generateCardBackSVG: () =>
    `<svg data-testid="card-back">back</svg>`,
}));

const testCard = { rank: '7' as any, suit: 'diamonds' as any, value: 7 };

describe('Card component accessibility', () => {
  it('renders with aria-label when selectable', () => {
    render(<Card card={testCard} selectable onClick={() => {}} />);
    const el = screen.getByRole('button');
    expect(el).toHaveAttribute('aria-label', '7 of Diamonds');
    expect(el).toHaveAttribute('tabindex', '0');
  });

  it('shows selected state in aria-label and aria-pressed', () => {
    render(<Card card={testCard} selectable selected onClick={() => {}} />);
    const el = screen.getByRole('button');
    expect(el).toHaveAttribute('aria-label', '7 of Diamonds, selected');
    expect(el).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not have role=button when not selectable', () => {
    render(<Card card={testCard} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders face-down card with correct label', () => {
    render(<Card faceDown selectable onClick={() => {}} />);
    const el = screen.getByRole('button');
    expect(el).toHaveAttribute('aria-label', 'Face-down card');
  });

  it('triggers onClick via Enter key', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card card={testCard} selectable onClick={onClick} />);
    const el = screen.getByRole('button');
    el.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('triggers onClick via Space key', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card card={testCard} selectable onClick={onClick} />);
    const el = screen.getByRole('button');
    el.focus();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledOnce();
  });
});
