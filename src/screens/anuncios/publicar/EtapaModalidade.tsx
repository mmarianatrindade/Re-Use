import { Controller, useWatch, type Control } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import Banner from '../../../components/Banner';
import Checkbox from '../../../components/Checkbox';
import ChipSelect from '../../../components/ChipSelect';
import FormTextField from '../../../components/FormTextField';
import { colors } from '../../../constants/colors';
import { fonts } from '../../../constants/fonts';
import type { AnuncioFormDados } from '../../../schemas/anuncio';
import { CATEGORIAS, COMPLEMENTO_TROCA, DESTINOS_DOACAO } from '../../../schemas/catalogo';
import { mascararPreco } from '../../../utils/mascaras';

const OPCOES_MODALIDADE = [
  { id: 'venda', label: 'Vender', descricao: 'Você define o preço e pode aceitar ofertas.', cor: colors.sale },
  { id: 'troca', label: 'Trocar', descricao: 'Receba propostas de outros itens. A primeira troca é gratuita.', cor: colors.trade },
  { id: 'doacao', label: 'Doar', descricao: 'Gratuito para quem recebe. Ajuda quem precisa.', cor: colors.donation },
];

export default function EtapaModalidade({ control }: { control: Control<AnuncioFormDados> }) {
  const modalidade = useWatch({ control, name: 'modalidade' });
  const trocaQualquerCategoria = useWatch({ control, name: 'trocaQualquerCategoria' });

  return (
    <>
      <Controller
        control={control}
        name="modalidade"
        render={({ field, fieldState }) => (
          <ChipSelect
            label="Modalidade"
            obrigatorio
            layout="lista"
            opcoes={OPCOES_MODALIDADE}
            valor={field.value}
            onChange={(valor) => field.onChange(valor)}
            erro={fieldState.error?.message}
          />
        )}
      />

      {modalidade === 'venda' ? (
        <>
          <FormTextField
            control={control}
            name="preco"
            label="Preço"
            obrigatorio
            prefixo="R$"
            placeholder="0,00"
            keyboardType="number-pad"
            mascara={mascararPreco}
            dica="A comissão do ReUse é descontada só quando a venda é concluída."
          />
          <Controller
            control={control}
            name="aceitaOfertas"
            render={({ field }) => (
              <Checkbox marcado={field.value} onAlternar={field.onChange} accessibilityLabel="Aceitar ofertas abaixo do preço">
                <Text style={styles.opcaoTitulo}>Aceitar ofertas</Text>
                <Text style={styles.opcaoTexto}>Interessados podem propor outro valor, e você decide se aceita.</Text>
              </Checkbox>
            )}
          />
        </>
      ) : null}

      {modalidade === 'troca' ? (
        <>
          <FormTextField
            control={control}
            name="preferenciaTroca"
            label="O que você aceita em troca?"
            obrigatorio
            multiline
            maxLength={300}
            placeholder="Ex.: um celular, livros de ficção ou uma cadeira de escritório."
            dica="Ajuda a receber propostas que interessam a você."
          />
          <Controller
            control={control}
            name="trocaQualquerCategoria"
            render={({ field }) => (
              <Checkbox marcado={field.value} onAlternar={field.onChange} accessibilityLabel="Aceito troca por qualquer categoria">
                <Text style={styles.opcaoTitulo}>Troco por itens de qualquer categoria</Text>
              </Checkbox>
            )}
          />
          {!trocaQualquerCategoria ? (
            <Controller
              control={control}
              name="trocaCategorias"
              render={({ field }) => (
                <ChipSelect
                  label="Categorias que você procura"
                  multiplo
                  opcoes={CATEGORIAS}
                  valor={field.value}
                  onChange={(valor) => field.onChange(valor)}
                />
              )}
            />
          ) : null}
          <Controller
            control={control}
            name="trocaComplemento"
            render={({ field, fieldState }) => (
              <ChipSelect
                label="Complemento em dinheiro"
                obrigatorio
                opcoes={COMPLEMENTO_TROCA}
                valor={field.value}
                onChange={(valor) => field.onChange(valor)}
                erro={fieldState.error?.message}
              />
            )}
          />
          <FormTextField
            control={control}
            name="valorEstimado"
            label="Valor estimado do item (opcional)"
            prefixo="R$"
            placeholder="0,00"
            keyboardType="number-pad"
            mascara={mascararPreco}
            dica="Só uma referência para quem propõe a troca. Não é preço nem crédito."
          />
        </>
      ) : null}

      {modalidade === 'doacao' ? (
        <>
          <Controller
            control={control}
            name="doacaoDestino"
            render={({ field, fieldState }) => (
              <ChipSelect
                label="Para quem é a doação?"
                obrigatorio
                layout="lista"
                opcoes={DESTINOS_DOACAO}
                valor={field.value}
                onChange={(valor) => field.onChange(valor)}
                erro={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="doacaoImediata"
            render={({ field }) => (
              <Checkbox marcado={field.value} onAlternar={field.onChange} accessibilityLabel="Disponível imediatamente">
                <Text style={styles.opcaoTitulo}>Disponível imediatamente</Text>
                <Text style={styles.opcaoTexto}>O item já pode ser retirado ou entregue.</Text>
              </Checkbox>
            )}
          />
          <Banner tom="sucesso" titulo="Obrigado por doar">
            Quem recebe não paga nada. Depois da entrega, a pessoa pode apoiar o ReUse de forma voluntária.
          </Banner>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  opcaoTitulo: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  opcaoTexto: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 2 },
});
