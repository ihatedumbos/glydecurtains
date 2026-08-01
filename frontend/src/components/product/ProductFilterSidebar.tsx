import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Slider,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { ProductFilters } from '@/store/slices/productSlice';

interface FilterOption {
  id: number | string;
  name: string;
}

interface ProductFilterSidebarProps {
  filters: ProductFilters;
  onFilterChange: (filters: ProductFilters) => void;
  categories: FilterOption[];
  subCategories: FilterOption[];
  colors: string[];
  sizes: string[];
  materials: string[];
  collections: FilterOption[];
}

export default function ProductFilterSidebar({
  filters,
  onFilterChange,
  categories,
  subCategories,
  colors,
  sizes,
  materials,
  collections,
}: ProductFilterSidebarProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 50000,
  ]);

  const handleCategoryChange = (categoryId: number) => {
    onFilterChange({
      ...filters,
      categoryId: filters.categoryId === categoryId ? undefined : categoryId,
      subCategoryId: undefined,
    });
  };

  const handleSubCategoryChange = (subCategoryId: number) => {
    onFilterChange({
      ...filters,
      subCategoryId: filters.subCategoryId === subCategoryId ? undefined : subCategoryId,
    });
  };

  const handleCollectionChange = (collectionId: number) => {
    onFilterChange({
      ...filters,
      collectionId: filters.collectionId === collectionId ? undefined : collectionId,
    });
  };

  const handleColorToggle = (color: string) => {
    const current = filters.colors || [];
    const updated = current.includes(color)
      ? current.filter((c) => c !== color)
      : [...current, color];
    onFilterChange({ ...filters, colors: updated.length > 0 ? updated : undefined });
  };

  const handleSizeToggle = (size: string) => {
    const current = filters.sizes || [];
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    onFilterChange({ ...filters, sizes: updated.length > 0 ? updated : undefined });
  };

  const handleMaterialToggle = (material: string) => {
    const current = filters.materials || [];
    const updated = current.includes(material)
      ? current.filter((m) => m !== material)
      : [...current, material];
    onFilterChange({ ...filters, materials: updated.length > 0 ? updated : undefined });
  };

  const handlePriceCommit = (_event: Event | React.SyntheticEvent, value: number | number[]) => {
    const [min, max] = value as [number, number];
    onFilterChange({ ...filters, minPrice: min > 0 ? min : undefined, maxPrice: max < 50000 ? max : undefined });
  };

  const handleClearFilters = () => {
    setPriceRange([0, 50000]);
    onFilterChange({});
  };

  const hasActiveFilters =
    filters.categoryId ||
    filters.subCategoryId ||
    filters.collectionId ||
    filters.colors?.length ||
    filters.sizes?.length ||
    filters.materials?.length ||
    filters.minPrice ||
    filters.maxPrice;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Filters
        </Typography>
        {hasActiveFilters && (
          <Button size="small" onClick={handleClearFilters} color="error">
            Clear All
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 1 }} />

      {/* Category */}
      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Category</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <FormGroup>
            {categories.map((cat) => (
              <FormControlLabel
                key={cat.id}
                control={
                  <Checkbox
                    checked={filters.categoryId === cat.id}
                    onChange={() => handleCategoryChange(cat.id as number)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{cat.name}</Typography>}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* Sub-Category */}
      {subCategories.length > 0 && (
        <Accordion disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={500}>Sub-Category</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <FormGroup>
              {subCategories.map((sub) => (
                <FormControlLabel
                  key={sub.id}
                  control={
                    <Checkbox
                      checked={filters.subCategoryId === sub.id}
                      onChange={() => handleSubCategoryChange(sub.id as number)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{sub.name}</Typography>}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Color */}
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Color</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {colors.map((color) => (
              <Chip
                key={color}
                label={color}
                size="small"
                variant={filters.colors?.includes(color) ? 'filled' : 'outlined'}
                color={filters.colors?.includes(color) ? 'primary' : 'default'}
                onClick={() => handleColorToggle(color)}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Size */}
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Size</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {sizes.map((size) => (
              <Chip
                key={size}
                label={size}
                size="small"
                variant={filters.sizes?.includes(size) ? 'filled' : 'outlined'}
                color={filters.sizes?.includes(size) ? 'primary' : 'default'}
                onClick={() => handleSizeToggle(size)}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Material */}
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Material</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <FormGroup>
            {materials.map((material) => (
              <FormControlLabel
                key={material}
                control={
                  <Checkbox
                    checked={filters.materials?.includes(material) || false}
                    onChange={() => handleMaterialToggle(material)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{material}</Typography>}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* Collection */}
      {collections.length > 0 && (
        <Accordion disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={500}>Collection</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <FormGroup>
              {collections.map((col) => (
                <FormControlLabel
                  key={col.id}
                  control={
                    <Checkbox
                      checked={filters.collectionId === col.id}
                      onChange={() => handleCollectionChange(col.id as number)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{col.name}</Typography>}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Price Range */}
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Price Range</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Slider
              value={priceRange}
              onChange={(_e, value) => setPriceRange(value as [number, number])}
              onChangeCommitted={handlePriceCommit}
              valueLabelDisplay="auto"
              min={0}
              max={50000}
              step={500}
              valueLabelFormat={(v) => `₹${v.toLocaleString('en-IN')}`}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                ₹{priceRange[0].toLocaleString('en-IN')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ₹{priceRange[1].toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Availability */}
      <Accordion disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={500}>Availability</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.status === 'ACTIVE'}
                  onChange={() =>
                    onFilterChange({
                      ...filters,
                      status: filters.status === 'ACTIVE' ? undefined : 'ACTIVE',
                    })
                  }
                  size="small"
                />
              }
              label={<Typography variant="body2">In Stock</Typography>}
            />
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
