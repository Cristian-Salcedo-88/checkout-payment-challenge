import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Modal from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Test">
        <p>content</p>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders its content when open', () => {
    render(
      <Modal isOpen onClose={jest.fn()} title="Test">
        <p>content</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={onClose} title="Test">
        <p>content</p>
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the escape key is pressed', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={onClose} title="Test">
        <p>content</p>
      </Modal>,
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the overlay outside the dialog', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Test">
        <p>content</p>
      </Modal>,
    );

    const overlay = screen.getByRole('dialog').parentElement as HTMLElement;
    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the dialog', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Test">
        <p>content</p>
      </Modal>,
    );

    screen.getByText('content').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
