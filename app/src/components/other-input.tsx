import { MAX_READING_DETAIL_LENGTH } from '@underscore/shared';

import { Input } from '@/components/ui/input';

/** The free-text field a `Something else` chip opens beneath its row. */
export function OtherInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      size="sm"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      accessibilityLabel={placeholder}
      maxLength={MAX_READING_DETAIL_LENGTH}
    />
  );
}
