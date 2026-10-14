import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { emojiIcon } from './EmojiIcon';

afterEach(cleanup);

describe('emojiIcon', () => {
  it('renders the emoji', () => {
    const Icon = emojiIcon('🔢');

    render(<Icon className="custom-icon" />);

    const icon = screen.getByText('🔢');
    expect(icon.tagName).toBe('SPAN');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveClass('custom-icon');
    expect(emojiIcon('🔢')).toBe(Icon);
  });
});
