import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import type { TextInput } from 'react-native';
import { View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

type ControlledInputProps<TValues extends FieldValues> = Omit<
  React.ComponentProps<typeof TextInput>,
  'value' | 'onChangeText' | 'onBlur'
> & {
  control: Control<TValues>;
  name: FieldPath<TValues>;
};

/** An `Input` bound to a react-hook-form field, with its validation message below it. */
export function ControlledInput<TValues extends FieldValues>({
  control,
  name,
  ...props
}: ControlledInputProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View className="gap-1.5">
          <Input
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={!!fieldState.error}
            {...props}
          />
          {fieldState.error && (
            <Text className="text-destructive font-body text-body-sm px-5">
              {fieldState.error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}
