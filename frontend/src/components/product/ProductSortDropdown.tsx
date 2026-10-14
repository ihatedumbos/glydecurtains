import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

interface ProductSortDropdownProps {
  value: string;
  onChange: (sortBy: string) => void;
  /** Offer "Best match" ordering - only meaningful while a search term is active. */
  showRelevance?: boolean;
}

const RELEVANCE_OPTION = { value: 'relevance', label: 'Best Match' };

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'featured', label: 'Featured' },
];

export default function ProductSortDropdown({ value, onChange, showRelevance = false }: ProductSortDropdownProps) {
  const options = showRelevance ? [RELEVANCE_OPTION, ...SORT_OPTIONS] : SORT_OPTIONS;
  const selected = options.some((o) => o.value === value) ? value : 'popularity';

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel id="product-sort-label">Sort By</InputLabel>
      <Select
        labelId="product-sort-label"
        id="product-sort"
        value={selected}
        label="Sort By"
        onChange={handleChange}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
