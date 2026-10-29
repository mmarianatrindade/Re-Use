import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import type { TextInput } from 'react-native';
import TextField, { type TextFieldProps } from './TextField';

interface FormTextFieldProps<T extends FieldValues> extends Omit<TextFieldProps, 'value' | 'onChangeText' | 'erro'> {
  control: Control<T>;
  name: Path<T>;
  // Chamado depois que o valor (já com máscara) muda no formulário.
  aoAlterar?: (valor: string) => void;
}

// TextField ligado ao React Hook Form: valor, alteração, foco (setFocus) e mensagem de erro vêm do formulário.
export default function FormTextField<T extends FieldValues>({ control, name, aoAlterar, ref, ...props }: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          ref={(instancia: TextInput | null) => {
            field.ref(instancia);
            if (typeof ref === 'function') {
              ref(instancia);
            } else if (ref) {
              ref.current = instancia;
            }
          }}
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={(valor) => {
            field.onChange(valor);
            aoAlterar?.(valor);
          }}
          onBlur={field.onBlur}
          erro={fieldState.error?.message}
        />
      )}
    />
  );
}
