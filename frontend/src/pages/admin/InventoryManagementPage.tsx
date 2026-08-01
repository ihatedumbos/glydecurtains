import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, CircularProgress,
  Alert, Tabs, Tab, Radio, RadioGroup, FormControlLabel, FormControl,
  FormLabel, Autocomplete, Chip, Divider,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  adjustStock,
  fetchAdjustmentHistory,
  updateThreshold,
  bulkAdjustFromCsv,
  clearError,
  clearBulkResults,
} from '@/store/slices/inventorySlice';
import type { AdjustmentType } from '@/store/slices/inventorySlice';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProductOption {
  id: number;
  name: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
      {value === index && children}
    </Box>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function InventoryManagementPage() {
  const dispatch = useAppDispatch();
  const { adjustmentHistory, pagination, isLoading, error, bulkResults } = useAppSelector(
    (state) => state.inventory,
  );

  const [tabIndex, setTabIndex] = useState(0);

  // Stock Adjustment Form
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('ADD');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  // History
  const [historyProductId, setHistoryProductId] = useState<number | null>(null);
  const [historyProduct, setHistoryProduct] = useState<ProductOption | null>(null);

  // Threshold
  const [thresholdProduct, setThresholdProduct] = useState<ProductOption | null>(null);
  const [thresholdValue, setThresholdValue] = useState<number | ''>('');
  const [thresholdSuccess, setThresholdSuccess] = useState<string | null>(null);

  // CSV Upload
  const [dragOver, setDragOver] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Product Autocomplete ─────────────────────────────────────────────────

  const fetchProducts = useCallback(async (search: string) => {
    try {
      const response = await axiosInstance.get('/products', {
        params: { search, page: 0, size: 20 },
      });
      const data = response.data.data ?? response.data;
      const products: ProductOption[] = (data.content ?? data).map((p: ProductOption) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
      }));
      setProductOptions(products);
    } catch {
      setProductOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchProducts(productSearch);
  }, [productSearch, fetchProducts]);

  // ─── Stock Adjustment Handlers ────────────────────────────────────────────

  const handleAdjustStock = async () => {
    if (!selectedProduct || quantity === '' || !reason.trim()) return;

    setAdjustSuccess(null);
    dispatch(clearError());

    const result = await dispatch(
      adjustStock({
        productId: selectedProduct.id,
        adjustmentType,
        quantity: Number(quantity),
        reason: reason.trim(),
      }),
    );

    if (adjustStock.fulfilled.match(result)) {
      setAdjustSuccess(
        `Stock adjusted successfully for "${selectedProduct.name}".`,
      );
      setSelectedProduct(null);
      setQuantity('');
      setReason('');
      setAdjustmentType('ADD');
    }
  };

  // ─── History Handlers ─────────────────────────────────────────────────────

  const handleLoadHistory = useCallback(
    (productId: number, page = 0) => {
      setHistoryProductId(productId);
      dispatch(fetchAdjustmentHistory({ productId, page, size: pagination.size }));
    },
    [dispatch, pagination.size],
  );

  const handleHistoryPageChange = (_: unknown, newPage: number) => {
    if (historyProductId) {
      handleLoadHistory(historyProductId, newPage);
    }
  };

  // ─── Threshold Handlers ───────────────────────────────────────────────────

  const handleUpdateThreshold = async () => {
    if (!thresholdProduct || thresholdValue === '') return;

    setThresholdSuccess(null);
    dispatch(clearError());

    const result = await dispatch(
      updateThreshold({
        productId: thresholdProduct.id,
        threshold: Number(thresholdValue),
      }),
    );

    if (updateThreshold.fulfilled.match(result)) {
      setThresholdSuccess(
        `Low-stock threshold updated to ${thresholdValue} for "${thresholdProduct.name}".`,
      );
      setThresholdProduct(null);
      setThresholdValue('');
    }
  };

  // ─── CSV Upload Handlers ──────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      setCsvFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const handleUploadCsv = async () => {
    if (!csvFile) return;
    dispatch(clearBulkResults());
    dispatch(clearError());
    await dispatch(bulkAdjustFromCsv(csvFile));
    setCsvFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <InventoryIcon fontSize="large" />
        <Typography variant="h4" fontWeight={600}>
          Inventory Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable">
          <Tab label="Stock Adjustment" />
          <Tab label="Adjustment History" />
          <Tab label="Threshold Configuration" />
          <Tab label="Bulk CSV Upload" />
        </Tabs>

        {/* ═══ Tab 0: Stock Adjustment ═══ */}
        <TabPanel value={tabIndex} index={0}>
          {adjustSuccess && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAdjustSuccess(null)}>
              {adjustSuccess}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
            <Autocomplete
              options={productOptions}
              getOptionLabel={(opt) => `${opt.name} (SKU: ${opt.sku})`}
              value={selectedProduct}
              onChange={(_, value) => setSelectedProduct(value)}
              onInputChange={(_, value) => setProductSearch(value)}
              renderInput={(params) => (
                <TextField {...params} label="Product" placeholder="Search by name or SKU..." required />
              )}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
            />

            <FormControl>
              <FormLabel>Adjustment Type</FormLabel>
              <RadioGroup
                row
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
              >
                <FormControlLabel value="ADD" control={<Radio />} label="Add" />
                <FormControlLabel value="REMOVE" control={<Radio />} label="Remove" />
                <FormControlLabel value="SET" control={<Radio />} label="Set" />
              </RadioGroup>
            </FormControl>

            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              inputProps={{ min: 0 }}
              required
            />

            <TextField
              label="Reason"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              inputProps={{ maxLength: 500 }}
              helperText={`${reason.length}/500 characters`}
              required
            />

            <Button
              variant="contained"
              onClick={handleAdjustStock}
              disabled={isLoading || !selectedProduct || quantity === '' || !reason.trim()}
              startIcon={isLoading ? <CircularProgress size={18} /> : undefined}
            >
              {isLoading ? 'Adjusting...' : 'Adjust Stock'}
            </Button>
          </Box>
        </TabPanel>

        {/* ═══ Tab 1: Adjustment History ═══ */}
        <TabPanel value={tabIndex} index={1}>
          <Box sx={{ mb: 3, maxWidth: 400 }}>
            <Autocomplete
              options={productOptions}
              getOptionLabel={(opt) => `${opt.name} (SKU: ${opt.sku})`}
              value={historyProduct}
              onChange={(_, value) => {
                setHistoryProduct(value);
                if (value) handleLoadHistory(value.id);
              }}
              onInputChange={(_, value) => setProductSearch(value)}
              renderInput={(params) => (
                <TextField {...params} label="Select Product" placeholder="Search by name or SKU..." />
              )}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
            />
          </Box>

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!isLoading && historyProductId && adjustmentHistory.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No adjustment history found for this product.
            </Typography>
          )}

          {!isLoading && adjustmentHistory.length > 0 && (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Resulting Stock</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Performed By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adjustmentHistory.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell>
                          {new Date(adj.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={adj.adjustmentType}
                            size="small"
                            color={
                              adj.adjustmentType === 'ADD'
                                ? 'success'
                                : adj.adjustmentType === 'REMOVE'
                                  ? 'error'
                                  : 'info'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">{adj.quantity}</TableCell>
                        <TableCell align="right">{adj.resultingStock}</TableCell>
                        <TableCell>{adj.reason}</TableCell>
                        <TableCell>{adj.performedByName || `User #${adj.performedBy}`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={pagination.totalElements}
                page={pagination.page}
                onPageChange={handleHistoryPageChange}
                rowsPerPage={pagination.size}
                rowsPerPageOptions={[10]}
              />
            </>
          )}
        </TabPanel>

        {/* ═══ Tab 2: Threshold Configuration ═══ */}
        <TabPanel value={tabIndex} index={2}>
          {thresholdSuccess && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setThresholdSuccess(null)}>
              {thresholdSuccess}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
            <Autocomplete
              options={productOptions}
              getOptionLabel={(opt) => `${opt.name} (SKU: ${opt.sku})`}
              value={thresholdProduct}
              onChange={(_, value) => {
                setThresholdProduct(value);
                if (value?.lowStockThreshold !== undefined) {
                  setThresholdValue(value.lowStockThreshold);
                }
              }}
              onInputChange={(_, value) => setProductSearch(value)}
              renderInput={(params) => (
                <TextField {...params} label="Product" placeholder="Search by name or SKU..." required />
              )}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
            />

            {thresholdProduct && (
              <Typography variant="body2" color="text.secondary">
                Current stock: {thresholdProduct.stockQuantity} | Current threshold:{' '}
                {thresholdProduct.lowStockThreshold ?? 'Not set'}
              </Typography>
            )}

            <TextField
              label="Low Stock Threshold"
              type="number"
              value={thresholdValue}
              onChange={(e) =>
                setThresholdValue(e.target.value === '' ? '' : Number(e.target.value))
              }
              inputProps={{ min: 0 }}
              helperText="Products at or below this quantity will trigger a low-stock alert"
              required
            />

            <Button
              variant="contained"
              onClick={handleUpdateThreshold}
              disabled={isLoading || !thresholdProduct || thresholdValue === ''}
              startIcon={isLoading ? <CircularProgress size={18} /> : undefined}
            >
              {isLoading ? 'Updating...' : 'Update Threshold'}
            </Button>
          </Box>
        </TabPanel>

        {/* ═══ Tab 3: Bulk CSV Upload ═══ */}
        <TabPanel value={tabIndex} index={3}>
          {bulkResults && (
            <Alert
              severity={bulkResults.failed > 0 ? 'warning' : 'success'}
              sx={{ mb: 2 }}
              onClose={() => dispatch(clearBulkResults())}
            >
              <Typography variant="body2">
                Processed: {bulkResults.totalProcessed} | Successful: {bulkResults.successful} | Failed: {bulkResults.failed}
              </Typography>
              {bulkResults.errors && bulkResults.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {bulkResults.errors.map((err, idx) => (
                    <Typography key={idx} variant="caption" display="block" color="error">
                      Row {err.row}: {err.message}
                    </Typography>
                  ))}
                </Box>
              )}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
            <Typography variant="body2" color="text.secondary">
              Upload a CSV file with columns: <code>productId, adjustmentType, quantity, reason</code>
            </Typography>

            <Divider />

            {/* Drag-and-drop area */}
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragOver ? 'action.hover' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1">
                {csvFile ? csvFile.name : 'Drag & drop a CSV file here, or click to browse'}
              </Typography>
              {csvFile && (
                <Typography variant="caption" color="text.secondary">
                  Size: {(csvFile.size / 1024).toFixed(1)} KB
                </Typography>
              )}
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <Button
              variant="contained"
              onClick={handleUploadCsv}
              disabled={isLoading || !csvFile}
              startIcon={isLoading ? <CircularProgress size={18} /> : <UploadIcon />}
            >
              {isLoading ? 'Uploading...' : 'Upload & Process'}
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}
