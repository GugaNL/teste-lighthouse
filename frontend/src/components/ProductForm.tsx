import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBlocker } from 'react-router-dom';
import FormField from './FormField';
import MoneyInput from './MoneyInput';
import ConfirmDialog from './ConfirmDialog';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';
import { productFormSchema } from '../schemas/productSchema';
import type { ProductFormValues } from '../schemas/productSchema';
import { toApiError } from '../services/api';
import { readRouteState } from '../types/navigation';
import { LIMITS, normalizeText, toFormValues } from '../utils/productRules';
import type { Product, ProductField, ProductInput } from '../types/product';

const ORDEM_DOS_CAMPOS: readonly ProductField[] = ['name', 'category', 'price', 'stock', 'description'];
const ehCampo = (nome: string): nome is ProductField =>
  (ORDEM_DOS_CAMPOS as readonly string[]).includes(nome);

export interface ProductFormProps {
  initialProduct?: Product;
  categories?: string[];
  submitLabel?: string;
  submittingLabel?: string;
  onSubmit: (payload: ProductInput) => Promise<void>;
  onCancel: () => void;
  alert?: ReactNode;
}

/**
 * Formulário único de produto — o MESMO para criar e para editar.
 *
 * Quem decide o que "salvar" significa é a página, via `onSubmit(payload)`:
 * a criação chama POST, a edição chama PUT. O formulário só cuida do que é
 * comum aos dois: valores, validação no cliente, estado de envio e a exibição
 * dos erros que voltarem da API (campo a campo, quando ela os detalha).
 *
 * `onSubmit` deve rejeitar com ApiError para o formulário mostrar o erro;
 * resolver significa que a página assumiu daqui (navegou, abriu um aviso...).
 */
export default function ProductForm({
  initialProduct,
  categories = [],
  submitLabel = 'Salvar',
  submittingLabel = 'Salvando…',
  onSubmit,
  onCancel,
  alert = null,
}: ProductFormProps) {
  const prefixo = useId();
  const idDo = (campo: ProductField) => `${prefixo}-${campo}`;

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting, isDirty, submitCount },
  } = useForm<ProductFormValues, unknown, ProductInput>({
    defaultValues: toFormValues(initialProduct),
    resolver: zodResolver(productFormSchema),
    // Revalida enquanto digita só depois que o campo já foi visitado ou já tem
    // erro — ninguém quer ver "obrigatório" na primeira tecla.
    mode: 'onTouched',
    shouldFocusError: false,
  });

  useUnsavedChangesWarning(isDirty && !isSubmitting);
  const navegacao = useBlocker(
    ({ nextLocation }) => isDirty && !isSubmitting && !readRouteState(nextLocation.state).highlightId
  );

  // O foco vai para o primeiro campo inválido — mas só depois que o fieldset
  // volta a ficar habilitado: input desabilitado (durante o envio) não recebe foco.
  const focarEm = useRef<ProductField | null>(null);
  const marcarPrimeiroInvalido = (encontrados: Partial<Record<ProductField, unknown>>) => {
    focarEm.current = ORDEM_DOS_CAMPOS.find((campo) => encontrados[campo]) ?? null;
  };
  useEffect(() => {
    if (isSubmitting || !focarEm.current) return;
    setFocus(focarEm.current);
    focarEm.current = null;
  }, [isSubmitting, submitCount, setFocus]);

  const salvar = async (payload: ProductInput) => {
    try {
      await onSubmit(payload);
    } catch (falha) {
      const erro = toApiError(falha);
      // A API valida de novo; se ela recusar algum campo, a mensagem dela vai
      // para baixo do campo certo, igual à validação local.
      const porCampo = Object.entries(erro.fieldErrors).filter(([campo]) => ehCampo(campo));
      for (const [campo, mensagem] of porCampo)
        setError(campo as ProductField, { type: 'server', message: mensagem });
      marcarPrimeiroInvalido(Object.fromEntries(porCampo));
      setError('root.server', {
        type: 'server',
        message: erro.message || 'Não foi possível salvar o produto.',
      });
    }
  };

  const aoInvalidar = (encontrados: FieldErrors<ProductFormValues>) => marcarPrimeiroInvalido(encontrados);

  const [nome, descricao] = useWatch({ control, name: ['name', 'description'] });
  const errosDeCampo = ORDEM_DOS_CAMPOS.filter((campo) => errors[campo]);
  const erroDoServidor = errors.root?.server?.message;
  const categoriasId = `${prefixo}-categorias`;

  return (
    <form
      className="formulario"
      onSubmit={(evento) => void handleSubmit(salvar, aoInvalidar)(evento)}
      noValidate
      aria-busy={isSubmitting}
    >
      {alert}

      {erroDoServidor ? (
        <div className="alerta alerta--erro" role="alert">
          <strong>Não foi possível salvar.</strong> {erroDoServidor}
        </div>
      ) : errosDeCampo.length > 1 ? (
        <div className="alerta alerta--erro" role="alert">
          Verifique os {errosDeCampo.length} campos destacados.
        </div>
      ) : null}

      <fieldset className="formulario__campos" disabled={isSubmitting}>
        <FormField
          id={idDo('name')}
          label="Nome"
          required
          error={errors.name?.message}
          counter={{ current: normalizeText(nome).length, max: LIMITS.name.max }}
          className="campo--largo"
        >
          {(props) => (
            <input
              {...props}
              {...register('name')}
              type="text"
              placeholder="Ex.: Fone Bluetooth Pulse ANC"
              autoComplete="off"
            />
          )}
        </FormField>

        <FormField
          id={idDo('category')}
          label="Categoria"
          required
          error={errors.category?.message}
          hint={categories.length ? 'Escolha uma existente ou digite uma nova.' : undefined}
        >
          {(props) => (
            <>
              <input
                {...props}
                {...register('category')}
                type="text"
                list={categoriasId}
                placeholder="Ex.: Eletrônicos"
                autoComplete="off"
              />
              <datalist id={categoriasId}>
                {categories.map((categoria) => (
                  <option key={categoria} value={categoria} />
                ))}
              </datalist>
            </>
          )}
        </FormField>

        <FormField id={idDo('price')} label="Preço" required error={errors.price?.message}>
          {(props) => (
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <MoneyInput
                  {...props}
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          )}
        </FormField>

        <FormField
          id={idDo('stock')}
          label="Estoque"
          required
          error={errors.stock?.message}
          hint="Unidades disponíveis."
        >
          {(props) => (
            <input
              {...props}
              {...register('stock')}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="0"
            />
          )}
        </FormField>

        <FormField
          id={idDo('description')}
          label="Descrição"
          error={errors.description?.message}
          counter={{ current: descricao.trim().length, max: LIMITS.description.max }}
          className="campo--largo"
        >
          {(props) => (
            <textarea
              {...props}
              {...register('description')}
              rows={4}
              placeholder="Detalhes que ajudam o cliente a decidir (opcional)."
            />
          )}
        </FormField>
      </fieldset>

      <div className="formulario__acoes">
        <button type="button" className="botao botao--fantasma" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" className="botao botao--primario" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner spinner--claro" aria-hidden="true" />
              {submittingLabel}
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>

      <ConfirmDialog
        open={navegacao.state === 'blocked'}
        title="Descartar alterações?"
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        onConfirm={() => navegacao.proceed?.()}
        onCancel={() => navegacao.reset?.()}
      >
        <p>As alterações feitas neste formulário ainda não foram salvas e serão perdidas.</p>
      </ConfirmDialog>
    </form>
  );
}
