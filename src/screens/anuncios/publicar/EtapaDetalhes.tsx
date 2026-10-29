import { Controller, useWatch, type Control } from 'react-hook-form';
import ChipSelect from '../../../components/ChipSelect';
import SeletorLista from '../../../components/SeletorLista';
import FormTextField from '../../../components/FormTextField';
import type { AnuncioFormDados } from '../../../schemas/anuncio';
import { CATEGORIAS, CONDICOES, encontrarCategoria } from '../../../schemas/catalogo';

interface EtapaDetalhesProps {
  control: Control<AnuncioFormDados>;
  // Ao trocar a categoria, a subcategoria escolhida deixa de valer.
  onCategoriaAlterada: () => void;
}

export default function EtapaDetalhes({ control, onCategoriaAlterada }: EtapaDetalhesProps) {
  const descricao = useWatch({ control, name: 'descricao' });
  const categoria = useWatch({ control, name: 'categoria' });
  const subcategorias = encontrarCategoria(categoria)?.subcategorias ?? [];

  return (
    <>
      <FormTextField
        control={control}
        name="titulo"
        label="Nome do item"
        obrigatorio
        placeholder="Ex.: Bicicleta aro 26 com marchas"
        maxLength={80}
        autoCapitalize="sentences"
        dica="Seja específico: marca, modelo e tamanho ajudam na busca."
      />
      <FormTextField
        control={control}
        name="descricao"
        label="Descrição"
        obrigatorio
        multiline
        maxLength={2000}
        placeholder="Estado, tempo de uso, medidas, defeitos e o que acompanha."
        dica={`${descricao.length}/2000 (mínimo de 20 caracteres)`}
      />
      <Controller
        control={control}
        name="categoria"
        render={({ field, fieldState }) => (
          <SeletorLista
            label="Categoria"
            obrigatorio
            placeholder="Escolha a categoria"
            opcoes={CATEGORIAS}
            valor={field.value}
            onChange={(valor) => {
              if (valor !== field.value) {
                onCategoriaAlterada();
              }
              field.onChange(valor);
            }}
            erro={fieldState.error?.message}
          />
        )}
      />
      {subcategorias.length > 0 ? (
        <Controller
          control={control}
          name="subcategoria"
          render={({ field, fieldState }) => (
            <SeletorLista
              label="Subcategoria"
              obrigatorio
              placeholder="Escolha a subcategoria"
              opcoes={subcategorias}
              valor={field.value}
              onChange={(valor) => field.onChange(valor)}
              erro={fieldState.error?.message}
            />
          )}
        />
      ) : null}
      <Controller
        control={control}
        name="condicao"
        render={({ field, fieldState }) => (
          <ChipSelect
            label="Estado do produto"
            obrigatorio
            layout="lista"
            descricaoSoSelecionada
            opcoes={CONDICOES}
            valor={field.value}
            onChange={(valor) => field.onChange(valor)}
            erro={fieldState.error?.message}
          />
        )}
      />
    </>
  );
}
