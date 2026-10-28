import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductForm from '../components/ProductForm';
import { ApiError } from '../services/api';

const produto = {
  id: '6720c1f4a2b9d43c8e1f0a11',
  name: 'Fone Bluetooth Pulse',
  description: 'Cancelamento de ruído',
  price: 349.9,
  stock: 25,
  category: 'Eletrônicos',
  version: 1,
};

const renderizar = (props = {}) => {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  const onCancel = props.onCancel ?? vi.fn();
  render(<ProductForm onSubmit={onSubmit} onCancel={onCancel} submitLabel="Salvar" {...props} />);
  return { onSubmit, onCancel, user: userEvent.setup() };
};

// Intl separa o símbolo do valor com espaço não separável (U+00A0).
const brl = (valor) => `R$\u00a0${valor}`;

const campo = (rotulo) => screen.getByLabelText(new RegExp(`^${rotulo}`));

describe('ProductForm — o mesmo formulário para criar e editar', () => {
  it('ao enviar vazio mostra todos os obrigatórios e não chama a API', async () => {
    const { onSubmit, user } = renderizar();
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Categoria é obrigatória')).toBeInTheDocument();
    expect(screen.getByText('Preço é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Estoque é obrigatório')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Verifique os 4 campos destacados.');
    expect(campo('Nome')).toHaveFocus();
    expect(campo('Nome')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('valida ao sair do campo, com a mesma regra da API', async () => {
    const { user } = renderizar();
    await user.type(campo('Nome'), 'TV');
    await user.tab();
    expect(screen.getByText('Nome deve ter pelo menos 3 caracteres')).toBeInTheDocument();
  });

  it('cria: envia o corpo normalizado, com preço digitado em centavos', async () => {
    const { onSubmit, user } = renderizar();

    await user.type(campo('Nome'), '  Mouse   sem fio ');
    await user.type(campo('Categoria'), 'Informática');
    await user.type(campo('Preço'), '24990');
    expect(campo('Preço')).toHaveValue(brl('249,90'));
    await user.type(campo('Estoque'), '7');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Mouse sem fio',
      description: '',
      price: 249.9,
      stock: 7,
      category: 'Informática',
    });
  });

  it('edita: abre preenchido com o produto', async () => {
    const { onSubmit, user } = renderizar({ initialProduct: produto });

    expect(campo('Nome')).toHaveValue('Fone Bluetooth Pulse');
    expect(campo('Preço')).toHaveValue(brl('349,90'));
    expect(campo('Estoque')).toHaveValue(25);

    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Fone Bluetooth Pulse',
      description: 'Cancelamento de ruído',
      price: 349.9,
      stock: 25,
      category: 'Eletrônicos',
    });
  });

  it('mostra o erro que a API devolveu embaixo do campo certo', async () => {
    const recusa = new ApiError({
      status: 400,
      message: 'Verifique os campos destacados.',
      details: [{ field: 'price', message: 'Preço acima do limite permitido' }],
    });
    const { user } = renderizar({ initialProduct: produto, onSubmit: vi.fn().mockRejectedValue(recusa) });

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Preço acima do limite permitido')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar.');
    expect(campo('Preço')).toHaveFocus();
  });

  it('mostra erro de rede sem perder o que foi digitado', async () => {
    const falha = new ApiError({ message: 'Não foi possível conectar à API.' });
    const { user } = renderizar({ initialProduct: produto, onSubmit: vi.fn().mockRejectedValue(falha) });

    await user.clear(campo('Nome'));
    await user.type(campo('Nome'), 'Nome novo');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText(/Não foi possível conectar à API/)).toBeInTheDocument();
    expect(campo('Nome')).toHaveValue('Nome novo');
  });

  it('enquanto salva, desabilita o formulário e mostra o progresso', async () => {
    let concluir;
    const onSubmit = vi.fn(() => new Promise((resolve) => (concluir = resolve)));
    const { user } = renderizar({ initialProduct: produto, onSubmit, submittingLabel: 'Salvando…' });

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByRole('button', { name: /Salvando/ })).toBeDisabled();
    expect(campo('Nome')).toBeDisabled();

    concluir();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled());
  });

  it('cancelar sem alterações sai direto', async () => {
    const { onCancel, user } = renderizar({ initialProduct: produto });
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('cancelar com alterações pede confirmação antes de descartar', async () => {
    const { onCancel, user } = renderizar({ initialProduct: produto });
    await user.type(campo('Nome'), ' X');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('alertdialog', { name: 'Descartar alterações?' })).toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
