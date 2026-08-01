import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Stack,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TrendingUp as SalesIcon,
  People as UsersIcon,
  Inventory as InventoryIcon,
  AccountBalance as ProfitIcon,
  ContactMail as EnquiryIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReportResponse {
  reportType: string;
  title: string;
  generatedAt: string;
  summary: Record<string, unknown>;
  data: Record<string, unknown>[];
  exportFormat: string | null;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  timestamp: string;
}

interface ReportFilter {
  startDate: string;
  endDate: string;
  groupBy: string;
}

// ─── Tab Panel ──────────────────────────────────────────────────────────────

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

// ─── Summary Cards ──────────────────────────────────────────────────────────

function SummaryCards({ summary }: { summary: Record<string, unknown> }) {
  const entries = Object.entries(summary);
  if (entries.length === 0) return null;

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {entries.map(([key, value]) => (
        <Grid item xs={12} sm={6} md={3} key={key}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                {formatLabel(key)}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatValue(value)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ─── Data Table ─────────────────────────────────────────────────────────────

function ReportTable({ data }: { data: Record<string, unknown>[] }) {
  if (!data || data.length === 0) {
    return <Alert severity="info">No data available for the selected filters.</Alert>;
  }

  const columns = Object.keys(data[0]);

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col} sx={{ fontWeight: 'bold' }}>
                {formatLabel(col)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx} hover>
              {columns.map((col) => (
                <TableCell key={col}>{formatValue(row[col])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Date Range Filter Bar ──────────────────────────────────────────────────

function FilterBar({
  filter,
  onChange,
  onApply,
  loading,
}: {
  filter: ReportFilter;
  onChange: (f: ReportFilter) => void;
  onApply: () => void;
  loading: boolean;
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
      <TextField
        label="Start Date"
        type="date"
        size="small"
        value={filter.startDate}
        onChange={(e) => onChange({ ...filter, startDate: e.target.value })}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="End Date"
        type="date"
        size="small"
        value={filter.endDate}
        onChange={(e) => onChange({ ...filter, endDate: e.target.value })}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Group By"
        select
        size="small"
        value={filter.groupBy}
        onChange={(e) => onChange({ ...filter, groupBy: e.target.value })}
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="day">Day</MenuItem>
        <MenuItem value="week">Week</MenuItem>
        <MenuItem value="month">Month</MenuItem>
      </TextField>
      <Button variant="contained" onClick={onApply} disabled={loading}>
        {loading ? <CircularProgress size={20} /> : 'Apply'}
      </Button>
    </Stack>
  );
}

// ─── Export Button ──────────────────────────────────────────────────────────

function ExportButtons({ report }: { report: ReportResponse | null }) {
  const handleExport = (format: string) => {
    if (!report) return;
    const exportData = {
      reportType: report.reportType,
      title: report.title,
      generatedAt: report.generatedAt,
      format,
      summary: report.summary,
      data: report.data,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.reportType}-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack direction="row" spacing={1}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<DownloadIcon />}
        onClick={() => handleExport('json')}
        disabled={!report}
      >
        Export JSON
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<DownloadIcon />}
        disabled
        title="CSV export coming soon"
      >
        Export CSV
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<DownloadIcon />}
        disabled
        title="PDF export coming soon"
      >
        Export PDF
      </Button>
    </Stack>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    return value % 1 === 0 ? value.toLocaleString() : value.toFixed(2);
  }
  return String(value);
}

function getDefaultFilter(): ReportFilter {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    groupBy: 'day',
  };
}

// ─── Individual Report Tabs ─────────────────────────────────────────────────

function SalesReport() {
  const [filter, setFilter] = useState<ReportFilter>(getDefaultFilter());
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { startDate: filter.startDate, endDate: filter.endDate, groupBy: filter.groupBy };
      const res = await axiosInstance.get<ApiResponse<ReportResponse>>('/dashboard/reports/sales', { params });
      setReport(res.data.data);
    } catch {
      setError('Failed to load sales report.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <Box>
      <FilterBar filter={filter} onChange={setFilter} onApply={fetchReport} loading={loading} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {report && (
        <>
          <SummaryCards summary={report.summary} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </Typography>
            <ExportButtons report={report} />
          </Box>
          <ReportTable data={report.data} />
        </>
      )}
      {loading && !report && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}

function UserActivityReport() {
  const [filter, setFilter] = useState<ReportFilter>(getDefaultFilter());
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { startDate: filter.startDate, endDate: filter.endDate, groupBy: filter.groupBy };
      const res = await axiosInstance.get<ApiResponse<ReportResponse>>('/dashboard/reports/users', { params });
      setReport(res.data.data);
    } catch {
      setError('Failed to load user activity report.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <Box>
      <FilterBar filter={filter} onChange={setFilter} onApply={fetchReport} loading={loading} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {report && (
        <>
          <SummaryCards summary={report.summary} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </Typography>
            <ExportButtons report={report} />
          </Box>
          <ReportTable data={report.data} />
        </>
      )}
      {loading && !report && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}

function InventoryReport() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get<ApiResponse<ReportResponse>>('/dashboard/reports/inventory');
      setReport(res.data.data);
    } catch {
      setError('Failed to load inventory report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button variant="contained" onClick={fetchReport} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Refresh'}
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {report && (
        <>
          <SummaryCards summary={report.summary} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </Typography>
            <ExportButtons report={report} />
          </Box>
          <ReportTable data={report.data} />
        </>
      )}
      {loading && !report && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}

function ProfitLossReport() {
  const [filter, setFilter] = useState<ReportFilter>(getDefaultFilter());
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { startDate: filter.startDate, endDate: filter.endDate, groupBy: filter.groupBy };
      const res = await axiosInstance.get<ApiResponse<ReportResponse>>('/dashboard/reports/profit-loss', { params });
      setReport(res.data.data);
    } catch {
      setError('Failed to load profit/loss report.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Profit/Loss report is a placeholder. Full accounting integration coming in a future release.
      </Alert>
      <FilterBar filter={filter} onChange={setFilter} onApply={fetchReport} loading={loading} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {report && (
        <>
          <SummaryCards summary={report.summary} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </Typography>
            <ExportButtons report={report} />
          </Box>
          <ReportTable data={report.data} />
        </>
      )}
      {loading && !report && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}

function EnquiryReport() {
  const [filter, setFilter] = useState<ReportFilter>(getDefaultFilter());
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { startDate: filter.startDate, endDate: filter.endDate, groupBy: filter.groupBy };
      const res = await axiosInstance.get<ApiResponse<ReportResponse>>('/dashboard/reports/enquiries', { params });
      setReport(res.data.data);
    } catch {
      setError('Failed to load enquiry report.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <Box>
      <FilterBar filter={filter} onChange={setFilter} onApply={fetchReport} loading={loading} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {report && (
        <>
          <SummaryCards summary={report.summary} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </Typography>
            <ExportButtons report={report} />
          </Box>
          <ReportTable data={report.data} />
        </>
      )}
      {loading && !report && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}

// ─── Main Reports Page ──────────────────────────────────────────────────────

export default function ReportsPage() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box className="p-4">
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Reports
      </Typography>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, newVal) => setTabIndex(newVal)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Report tabs"
        >
          <Tab icon={<SalesIcon />} iconPosition="start" label="Sales" />
          <Tab icon={<UsersIcon />} iconPosition="start" label="User Activity" />
          <Tab icon={<InventoryIcon />} iconPosition="start" label="Inventory" />
          <Tab icon={<ProfitIcon />} iconPosition="start" label="Profit / Loss" />
          <Tab icon={<EnquiryIcon />} iconPosition="start" label="Enquiries" />
        </Tabs>
      </Paper>

      <TabPanel value={tabIndex} index={0}>
        <SalesReport />
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <UserActivityReport />
      </TabPanel>
      <TabPanel value={tabIndex} index={2}>
        <InventoryReport />
      </TabPanel>
      <TabPanel value={tabIndex} index={3}>
        <ProfitLossReport />
      </TabPanel>
      <TabPanel value={tabIndex} index={4}>
        <EnquiryReport />
      </TabPanel>
    </Box>
  );
}
