import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'OPEN', label: 'Aberto' },
  { value: 'PRIVATE', label: 'Fechado' },
] as const;

describe('SegmentedControl', () => {
  it('marks the selected option as pressed', () => {
    render(<SegmentedControl value="OPEN" onChange={vi.fn()} options={[...options]} />);

    expect(screen.getByRole('button', { name: 'Aberto' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Fechado' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with the chosen value', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl value="OPEN" onChange={onChange} options={[...options]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Fechado' }));

    expect(onChange).toHaveBeenCalledWith('PRIVATE');
  });
});
