import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  ClickAwayListener,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ClearIcon from '@mui/icons-material/Clear';
import { useAppSelector } from '@/store/hooks';

interface ProductSearchBarProps {
  value: string;
  onChange: (query: string) => void;
  onSearch: (query: string) => void;
  suggestions: string[];
  onFetchSuggestions: (query: string) => void;
}

export default function ProductSearchBar({
  value,
  onChange,
  onSearch,
  suggestions,
  onFetchSuggestions,
}: ProductSearchBarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { recentSearches } = useAppSelector((state) => state.search);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedFetch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (query.length >= 2) {
          onFetchSuggestions(query);
        }
      }, 300);
    },
    [onFetchSuggestions],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocalValue(query);
    onChange(query);
    debouncedFetch(query);
    setShowDropdown(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(localValue);
      setShowDropdown(false);
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalValue(suggestion);
    onChange(suggestion);
    onSearch(suggestion);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onSearch('');
  };

  const showSuggestions = suggestions.length > 0 && localValue.length >= 2;
  const showRecent = isAuthenticated && recentSearches.length > 0 && localValue.length === 0;

  return (
    <ClickAwayListener onClickAway={() => setShowDropdown(false)}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search products..."
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: localValue ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClear} aria-label="Clear search">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.paper',
            },
          }}
        />

        {/* Dropdown */}
        {showDropdown && (showSuggestions || showRecent) && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              zIndex: 1300,
              maxHeight: 300,
              overflow: 'auto',
              borderRadius: 2,
            }}
          >
            {/* Autocomplete suggestions */}
            {showSuggestions && (
              <List dense disablePadding>
                {suggestions.map((suggestion, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemButton onClick={() => handleSuggestionClick(suggestion)}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <TrendingUpIcon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}

            {/* Recent searches for authenticated users */}
            {showRecent && (
              <>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Recent Searches
                  </Typography>
                </Box>
                <Divider />
                <List dense disablePadding>
                  {recentSearches.map((search, idx) => (
                    <ListItem key={idx} disablePadding>
                      <ListItemButton onClick={() => handleSuggestionClick(search)}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <HistoryIcon fontSize="small" color="action" />
                        </ListItemIcon>
                        <ListItemText primary={search} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
