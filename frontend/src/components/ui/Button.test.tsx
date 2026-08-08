import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('renders its label and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Confirmar</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Confirmar</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type="button" to avoid accidental form submits', () => {
    render(<Button>Ação</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
