import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../components/ConfirmDialog';
import type { ConfirmDialogProps } from '../components/ConfirmDialog';

const abrir = (props: Partial<ConfirmDialogProps> = {}) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Excluir produto?"
      confirmLabel="Excluir"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    >
      <p>Esta ação não pode ser desfeita.</p>
    </ConfirmDialog>
  );
  return { onConfirm, onCancel, user: userEvent.setup() };
};

describe('ConfirmDialog', () => {
  it('não renderiza nada fechado', () => {
    render(<ConfirmDialog open={false} title="X" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('abre acessível e com o foco no botão seguro (Cancelar)', () => {
    abrir();
    const dialogo = screen.getByRole('alertdialog', { name: 'Excluir produto?' });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(dialogo).toHaveAccessibleDescription('Esta ação não pode ser desfeita.');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('confirma e cancela', async () => {
    const { onConfirm, onCancel, user } = abrir();
    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Esc cancela', async () => {
    const { onCancel, user } = abrir();
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalled();
  });

  it('mantém o Tab dentro do diálogo', async () => {
    const { user } = abrir();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Excluir' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('ocupado: trava os botões, ignora Esc e mostra o progresso', async () => {
    const { onCancel, user } = abrir({ busy: true, busyLabel: 'Excluindo…' });
    expect(screen.getByRole('button', { name: /Excluindo/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('clique no fundo cancela; clique dentro da caixa não', async () => {
    const { onCancel, user } = abrir();
    await user.click(screen.getByText('Esta ação não pode ser desfeita.'));
    expect(onCancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole('alertdialog'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('abre como modal nativo e devolve o foco para quem abriu', () => {
    const { rerender } = render(<button type="button">Abrir</button>);
    const gatilho = screen.getByRole('button', { name: 'Abrir' });
    gatilho.focus();
    const dialogo = (open: boolean) => (
      <>
        <button type="button">Abrir</button>
        <ConfirmDialog open={open} title="Excluir?" onConfirm={() => {}} onCancel={() => {}} />
      </>
    );
    rerender(dialogo(true));
    expect(screen.getByRole('alertdialog')).toHaveAttribute('open');
    rerender(dialogo(false));
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus();
  });

  it('mostra o erro da ação dentro do diálogo', () => {
    abrir({ error: 'Não foi possível excluir.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível excluir.');
  });
});
