export function modelPickerDisplay(options: {
  isSearching: boolean;
  query: string;
  label?: string;
  id: string;
}): string {
  const { isSearching, query, label, id } = options;
  if (isSearching) return query;
  return label || id || '';
}
