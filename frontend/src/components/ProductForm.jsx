import { useEffect, useId, useMemo, useState } from 'react';
import FormField from './FormField';
import MoneyInput from './MoneyInput';
import ConfirmDialog from './ConfirmDialog';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';
import {
  LIMITS,
  PRODUCT_FIELDS,
  toFormValues,
  toPayload,
  validateField,
  validateProduct,
} from '../utils/productRules';

const ORDEM_DOS_CAMPOS = ['name', 'category', 'price', 'stock', 'description'];
const TODOS_TOCADOS = Object.fromEntries(PRODUCT_FIELDS.map((campo) => [campo, true]));

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
}) {
  const prefixo = useId();
  const idDo = (campo) => `${prefixo}-${campo}`;

  const valoresIniciais = useMemo(() => toFormValues(initialProduct), [initialProduct]);
  const [values, setValues] = useState(valoresIniciais);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);

  const alterado = PRODUCT_FIELDS.some(
    (campo) => String(values[campo] ?? '') !== String(valoresIniciais[campo] ?? '')
  );
  useUnsavedChangesWarning(alterado && !submitting);

  // O foco vai para o primeiro campo inválido — mas só depois que o fieldset
  // volta a ficar habilitado: input desabilitado (durante o envio) não recebe foco.
  const [focarEm, setFocarEm] = useState(null);
  const focarPrimeiroInvalido = (encontrados) => {
    setFocarEm(ORDEM_DOS_CAMPOS.find((c) => encontrados[c]) ?? null);
  };
  useEffect(() => {
    if (submitting || !focarEm) return;
    document.getElementById(idDo(focarEm))?.focus();
    setFocarEm(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting, focarEm]);

  const alterar = (campo, valor) => {
    const proximos = { ...values, [campo]: valor };
    setValues(proximos);
    // Revalida enquanto digita só depois que o campo já foi visitado ou já tem
    // erro — ninguém quer ver "obrigatório" na primeira tecla.
    if (touched[campo] || errors[campo]) {
      setErrors((atuais) => ({ ...atuais, [campo]: validateField(campo, proximos) }));
    }
  };

  const sair = (campo) => {
    setTouched((atuais) => ({ ...atuais, [campo]: true }));
    setErrors((atuais) => ({ ...atuais, [campo]: validateField(campo, values) }));
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setTouched(TODOS_TOCADOS);

    const encontrados = validateProduct(values);
    setErrors(encontrados);
    if (Object.keys(encontrados).length) {
      setFormError('');
      focarPrimeiroInvalido(encontrados);
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit(toPayload(values));
    } catch (erro) {
      // A API valida de novo; se ela recusar algum campo, a mensagem dela vai
      // para baixo do campo certo, igual à validação local.
      const porCampo = erro?.fieldErrors ?? {};
      if (Object.keys(porCampo).length) {
        setErrors(porCampo);
        focarPrimeiroInvalido(porCampo);
      }
      setFormError(erro?.message || 'Não foi possível salvar o produto.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelar = () => (alterado ? setConfirmandoDescarte(true) : onCancel());

  const errosVisiveis = Object.entries(errors).filter(([campo, erro]) => erro && touched[campo]);
  const erroDo = (campo) => (touched[campo] ? errors[campo] : '');
  const categoriasId = `${prefixo}-categorias`;

  return (
    <form className="formulario" onSubmit={enviar} noValidate aria-busy={submitting}>
      {alert}

      {formError ? (
        <div className="alerta alerta--erro" role="alert">
          <strong>Não foi possível salvar.</strong> {formError}
        </div>
      ) : errosVisiveis.length > 1 ? (
        <div className="alerta alerta--erro" role="alert">
          Verifique os {errosVisiveis.length} campos destacados.
        </div>
      ) : null}

      <fieldset className="formulario__campos" disabled={submitting}>
        <FormField
          id={idDo('name')}
          label="Nome"
          required
          error={erroDo('name')}
          counter={{ atual: values.name.trim().length, max: LIMITS.name.max }}
          className="campo--largo"
        >
          {(props) => (
            <input
              {...props}
              type="text"
              value={values.name}
              onChange={(e) => alterar('name', e.target.value)}
              onBlur={() => sair('name')}
              placeholder="Ex.: Fone Bluetooth Pulse ANC"
              autoComplete="off"
            />
          )}
        </FormField>

        <FormField
          id={idDo('category')}
          label="Categoria"
          required
          error={erroDo('category')}
          hint={categories.length ? 'Escolha uma existente ou digite uma nova.' : undefined}
        >
          {(props) => (
            <>
              <input
                {...props}
                type="text"
                list={categoriasId}
                value={values.category}
                onChange={(e) => alterar('category', e.target.value)}
                onBlur={() => sair('category')}
                placeholder="Ex.: Eletrônicos"
                autoComplete="off"
              />
              <datalist id={categoriasId}>
                {categories.map((nome) => (
                  <option key={nome} value={nome} />
                ))}
              </datalist>
            </>
          )}
        </FormField>

        <FormField id={idDo('price')} label="Preço" required error={erroDo('price')}>
          {(props) => (
            <MoneyInput
              {...props}
              value={values.price}
              onChange={(valor) => alterar('price', valor)}
              onBlur={() => sair('price')}
            />
          )}
        </FormField>

        <FormField id={idDo('stock')} label="Estoque" required error={erroDo('stock')} hint="Unidades disponíveis.">
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={values.stock}
              onChange={(e) => alterar('stock', e.target.value)}
              onBlur={() => sair('stock')}
              placeholder="0"
            />
          )}
        </FormField>

        <FormField
          id={idDo('description')}
          label="Descrição"
          error={erroDo('description')}
          counter={{ atual: values.description.trim().length, max: LIMITS.description.max }}
          className="campo--largo"
        >
          {(props) => (
            <textarea
              {...props}
              rows={4}
              value={values.description}
              onChange={(e) => alterar('description', e.target.value)}
              onBlur={() => sair('description')}
              placeholder="Detalhes que ajudam o cliente a decidir (opcional)."
            />
          )}
        </FormField>
      </fieldset>

      <div className="formulario__acoes">
        <button type="button" className="botao botao--fantasma" onClick={cancelar} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="botao botao--primario" disabled={submitting}>
          {submitting ? (
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
        open={confirmandoDescarte}
        title="Descartar alterações?"
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        onConfirm={() => {
          setConfirmandoDescarte(false);
          onCancel();
        }}
        onCancel={() => setConfirmandoDescarte(false)}
      >
        <p>As alterações feitas neste formulário ainda não foram salvas e serão perdidas.</p>
      </ConfirmDialog>
    </form>
  );
}
