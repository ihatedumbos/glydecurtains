import { Box, IconButton, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { MAX_QUANTITY_PER_ITEM } from '@/utils/constants';

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  max?: number;
  min?: number;
  disabled?: boolean;
}

export default function QuantitySelector({
  value,
  onChange,
  max = MAX_QUANTITY_PER_ITEM,
  min = 1,
  disabled = false,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    onChange(Math.max(min, value - 1));
  };

  const handleIncrement = () => {
    onChange(Math.min(max, value + 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.min(max, Math.max(min, parsed));
    onChange(clamped);
  };

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <IconButton
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        size="small"
        aria-label="Decrease quantity"
      >
        <RemoveIcon fontSize="small" />
      </IconButton>

      <TextField
        type="number"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        inputProps={{ min, max, style: { textAlign: 'center', width: '40px', padding: '4px' } }}
        size="small"
        sx={{ '& .MuiOutlinedInput-root': { height: 32 } }}
      />

      <IconButton
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        size="small"
        aria-label="Increase quantity"
      >
        <AddIcon fontSize="small" />
      </IconButton>

      {value >= max && (
        <Typography variant="caption" color="error" sx={{ ml: 0.5, whiteSpace: 'nowrap' }}>
          Max {max} per item
        </Typography>
      )}
    </Box>
  );
}
