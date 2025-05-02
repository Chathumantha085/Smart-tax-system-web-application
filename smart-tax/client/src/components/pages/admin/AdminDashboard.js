import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Visibility } from '@mui/icons-material';
import {
  AppBar, Toolbar, Typography, Container, Paper, Tabs, Tab, Box,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Grid, IconButton, Menu, MenuItem, Avatar,
  useTheme, useMediaQuery, LinearProgress, Snackbar, Alert,
  Card, CardContent, Divider, Button, InputAdornment, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem as SelectMenuItem, TextareaAutosize
} from '@mui/material';
import {
  People, CheckCircle, Pending, PersonAdd, Logout,
  DarkMode, LightMode, Menu as MenuIcon, Search,
  Check, Close, Edit, Delete, Refresh, Category,
  InsertChart, PictureAsPdf, DateRange, FilterAlt
} from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFDocument } from './PDFDocument.js';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

// Styled Components
const GlassPaper = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'rgba(30, 30, 40, 0.7)'
    : 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  boxShadow: theme.shadows[10],
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3)
}));

// Reusable components
const SectionHeader = ({ title }) => (
  <Typography variant="subtitle1" sx={{
    fontWeight: 600,
    mb: 2,
    color: 'text.secondary',
    borderBottom: '2px solid',
    borderColor: 'divider',
    pb: 0.5
  }}>
    {title}
  </Typography>
);

const InfoRow = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="body2" sx={{
      fontWeight: 500,
      color: 'text.secondary',
      mb: 0.5
    }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 400 }}>
      {value || '-'}
    </Typography>
  </Box>
);

// Custom DatePicker input to match MUI style
const CustomDatePickerInput = React.forwardRef(({ value, onClick, ...props }, ref) => (
  <TextField
    fullWidth
    margin="normal"
    value={value}
    onClick={onClick}
    ref={ref}
    InputProps={{
      endAdornment: (
        <InputAdornment position="end">
          <DateRange />
        </InputAdornment>
      ),
    }}
    {...props}
  />
));

const StatCard = ({ title, value, icon, color }) => {
  const theme = useTheme();
  return (
    <GlassPaper>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: theme.palette[color].light,
              color: theme.palette[color].dark,
              borderRadius: '50%',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </GlassPaper>
  );
};

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({
    id: null,
    name: '',
    description: '',
    tax_percentage: '',
    is_active: 1
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    totalCategories: 0,
    activeCategories: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [reportConfig, setReportConfig] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    reportType: 'summary',
    filters: {}
  });
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfConfig, setPdfConfig] = useState({
    title: 'Admin Report',
    includeCharts: true,
    includeTables: true
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const usersResponse = await api.get('/api/users');
      setUsers(usersResponse.data);

      // Calculate statistics
      const totalUsers = usersResponse.data.length;
      const approvedUsers = usersResponse.data.filter(u => u.isApproved === 1).length;

      setStats({
        ...stats,
        totalUsers,
        approvedUsers,
        pendingUsers: totalUsers - approvedUsers
      });

      // Fetch categories
      const categoriesResponse = await api.get('/api/tax-categories');
      setCategories(categoriesResponse.data);

      // Update category stats
      const totalCategories = categoriesResponse.data.length;
      const activeCategories = categoriesResponse.data.filter(c => c.is_active).length;

      setStats(prev => ({
        ...prev,
        totalCategories,
        activeCategories
      }));

      setError(null);
    } catch (err) {
      handleApiError(err, 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Handle user approval
  const handleApproveUser = async (userId, approve) => {
    try {
      const endpoint = approve ? 'approve' : 'reject';
      await api.patch(`/api/users/${endpoint}/${userId}`);
      setSuccess(`User ${approve ? 'approved' : 'rejected'} successfully!`);
      fetchData();
    } catch (err) {
      handleApiError(err, `Failed to ${approve ? 'approve' : 'reject'} user`);
    }
  };

  // Handle category status toggle
  const toggleCategoryStatus = async (category) => {
    try {
      const updatedCategory = { ...category, is_active: !category.is_active };
      const response = await api.put(`/api/tax-categories/${category.id}`, updatedCategory);
      setCategories(categories.map(cat =>
        cat.id === category.id ? response.data : cat
      ));
      setSuccess(`Category ${updatedCategory.is_active ? 'activated' : 'deactivated'}!`);

      // Update stats
      const activeCategories = updatedCategory.is_active ?
        stats.activeCategories + 1 : stats.activeCategories - 1;
      setStats(prev => ({
        ...prev,
        activeCategories
      }));
    } catch (err) {
      handleApiError(err, 'Failed to update category status');
    }
  };

  // Generate report data from existing state
  const generateReportData = () => {
    // Create user registration data
    const userRegistrations = users.map(user => ({
      date: new Date(user.created_at).toLocaleDateString(),
      count: 1
    }));

    // Create category usage data
    const categoryUsage = categories.map(category => ({
      name: category.name,
      count: category.tax_percentage
    }));

    return {
      userRegistrations,
      categoryUsage,
      stats
    };
  };

  // Handle API errors
  const handleApiError = (err, defaultMessage) => {
    const errorMessage = err.response?.data?.message || defaultMessage;
    setError(errorMessage);
    console.error(errorMessage, err);

    if (err.response?.status === 401) {
      authApi.logout();
    }
  };

  // API functions
  const authApi = {
    logout: () => {
      localStorage.removeItem('token');
      navigate('/');
    },
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );



  const CategoryFormDialog = () => (
    <Dialog
      open={categoryDialogOpen}
      onClose={() => setCategoryDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{
        bgcolor: 'primary.main',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2
      }}>
        {isEditMode ? 'Edit Tax Category' : 'Add New Tax Category'}
        <IconButton onClick={() => setCategoryDialogOpen(false)} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <form onSubmit={handleCategorySubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name"
                value={currentCategory.name}
                onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                required
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tax Percentage"
                type="number"
                value={currentCategory.tax_percentage}
                onChange={(e) => setCurrentCategory({ ...currentCategory, tax_percentage: e.target.value })}
                required
                margin="normal"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={currentCategory.description}
                onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={currentCategory.is_active}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, is_active: e.target.value })}
                  label="Status"
                >
                  <MenuItem value={1}>Active</MenuItem>
                  <MenuItem value={0}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <DialogActions sx={{ mt: 2 }}>
            <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );

  const handleAddCategory = () => {
    setCurrentCategory({
      id: null,
      name: '',
      description: '',
      tax_percentage: '',
      is_active: 1
    });
    setIsEditMode(false);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category) => {
    setCurrentCategory({
      id: category.id,
      name: category.name,
      description: category.description,
      tax_percentage: category.tax_percentage,
      is_active: category.is_active
    });
    setIsEditMode(true);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await api.delete(`/api/tax-categories/${categoryId}`);
      setSuccess('Category deleted successfully!');
      fetchData();
    } catch (err) {
      handleApiError(err, 'Failed to delete category');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const categoryData = {
        name: currentCategory.name,
        description: currentCategory.description,
        tax_percentage: parseFloat(currentCategory.tax_percentage),
        is_active: currentCategory.is_active
      };

      if (isEditMode) {
        await api.put(`/api/tax-categories/${currentCategory.id}`, categoryData);
        setSuccess('Category updated successfully!');
      } else {
        await api.post('/api/tax-categories', categoryData);
        setSuccess('Category created successfully!');
      }

      setCategoryDialogOpen(false);
      fetchData();
    } catch (err) {
      handleApiError(err, `Failed to ${isEditMode ? 'update' : 'create'} category`);
    }
  };
  // Set up interceptors and initial data fetch
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    fetchData();

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [navigate]);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: theme.palette.mode === 'dark'
        ? 'radial-gradient(circle at center, #1a1a2e 0%, #16213e 70%, #0f3460 100%)'
        : 'radial-gradient(circle at center, #f5f7fa 0%, #e4e8f0 70%, #d0d7e2 100%)'
    }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{
        background: 'transparent',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" color="inherit" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" component="div" sx={{
            flexGrow: 1,
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            ADMIN DASHBOARD
          </Typography>

          {/* <IconButton color="inherit">
            {theme.palette.mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton> */}

          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{
              width: 36,
              height: 36,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
            }}>
              A
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={authApi.logout}>
              <Logout sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {/* Loading Indicator */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Notifications */}
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)}>
          <Alert severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>

        {/* Main Content */}
        <GlassPaper>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            textColor="secondary"
            indicatorColor="secondary"
          >
            <Tab label="Users" icon={<People />} iconPosition="start" />
            <Tab label="Tax Categories" icon={<Category />} iconPosition="start" />
            <Tab label="Reports" icon={<InsertChart />} iconPosition="start" />
          </Tabs>
        </GlassPaper>

        {activeTab === 0 && (
          <Box>
            {/* User Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={<People fontSize="large" />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Approved Users"
                  value={stats.approvedUsers}
                  icon={<CheckCircle fontSize="large" />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Pending Approval"
                  value={stats.pendingUsers}
                  icon={<Pending fontSize="large" />}
                  color="warning"
                />
              </Grid>
            </Grid>

            {/* User Management */}
            <GlassPaper>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">User Management</Typography>
                <Box display="flex" gap={2}>
                  <TextField
                    size="small"
                    placeholder="Search users..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      )
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Refresh />}
                    onClick={fetchData}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Registered</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.isApproved ? 'Approved' : 'Pending'}
                            color={user.isApproved ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={() => handleViewDetails(user)}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            color={user.isApproved ? 'error' : 'success'}
                            onClick={() => handleApproveUser(user.id, !user.isApproved)}
                          >
                            {user.isApproved ? <Close /> : <Check />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* User Details Dialog */}
              <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                  sx: { borderRadius: 3 }
                }}
              >
                <DialogTitle sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Box display="flex" alignItems="center">
                    User Profile
                  </Box>
                  <IconButton onClick={() => setOpenDialog(false)} sx={{ color: 'white' }}>
                    <Close />
                  </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                  {selectedUser && (
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                      {/* Left Column */}
                      <Grid item xs={12} md={6}>
                        <SectionHeader title="Personal Information" />
                        <InfoRow label="Full Name" value={selectedUser.name} />
                        <InfoRow label="Email" value={selectedUser.email} />
                        <InfoRow label="Contact Number" value={selectedUser.contact_number} />
                        <InfoRow label="Gender" value={selectedUser.gender} />
                        <InfoRow label="Nationality" value={selectedUser.nationality} />
                      </Grid>

                      {/* Right Column */}
                      <Grid item xs={12} md={6}>
                        <SectionHeader title="Account Details" />
                        <InfoRow label="User Role" value={selectedUser.role} />
                        <InfoRow label="Registration Date"
                          value={new Date(selectedUser.created_at).toLocaleString()} />
                        <InfoRow label="ID Number" value={selectedUser.id_number} />
                        <InfoRow label="Address" value={selectedUser.address} />

                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, mr: 1 }}>
                            Status:
                          </Typography>
                          <Chip
                            label={selectedUser.isApproved ? 'Approved' : 'Pending'}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderRadius: 1,
                              borderWidth: 2,
                              borderColor: selectedUser.isApproved ? 'success.main' : 'warning.main',
                              color: selectedUser.isApproved ? 'success.dark' : 'warning.dark',
                              bgcolor: selectedUser.isApproved ? 'success.light' : 'warning.light'
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </DialogContent>
              </Dialog>
            </GlassPaper>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Tax Categories Statistics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <StatCard
                  title="Total Categories"
                  value={stats.totalCategories}
                  icon={<Category fontSize="large" />}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <StatCard
                  title="Active Categories"
                  value={stats.activeCategories}
                  icon={<CheckCircle fontSize="large" />}
                  color="success"
                />
              </Grid>
            </Grid>

            {/* Tax Categories Management */}
            <GlassPaper>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Tax Categories</Typography>
                <Box display="flex" gap={2}>
                  <TextField
                    size="small"
                    placeholder="Search categories..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      )
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAdd />}
                    onClick={handleAddCategory}
                  >
                    Add Category
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Refresh />}
                    onClick={fetchData}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Tax Rate</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.tax_percentage}%</TableCell>
                        <TableCell>
                          <Chip
                            label={category.is_active ? 'Active' : 'Inactive'}
                            color={category.is_active ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {category.description}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Delete />
                          </IconButton>
                          <IconButton
                            color={category.is_active ? 'error' : 'success'}
                            onClick={() => toggleCategoryStatus(category)}
                          >
                            {category.is_active ? <Close /> : <Check />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </GlassPaper>

            {/* Render the category form dialog */}
            {/* <CategoryFormDialog /> */}

            <Dialog
              open={categoryDialogOpen}
              onClose={() => setCategoryDialogOpen(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle sx={{
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2
              }}>
                {isEditMode ? 'Edit Tax Category' : 'Add New Tax Category'}
                <IconButton onClick={() => setCategoryDialogOpen(false)} sx={{ color: 'white' }}>
                  <Close />
                </IconButton>
              </DialogTitle>

              <DialogContent sx={{ p: 3 }}>
                <form onSubmit={handleCategorySubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Category Name"
                        value={currentCategory.name}
                        onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                        required
                        margin="normal"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Tax Percentage"
                        type="number"
                        value={currentCategory.tax_percentage}
                        onChange={(e) => setCurrentCategory({ ...currentCategory, tax_percentage: e.target.value })}
                        required
                        margin="normal"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={currentCategory.description}
                        onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                        multiline
                        rows={3}
                        margin="normal"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={currentCategory.is_active}
                          onChange={(e) => setCurrentCategory({ ...currentCategory, is_active: e.target.value })}
                          label="Status"
                        >
                          <MenuItem value={1}>Active</MenuItem>
                          <MenuItem value={0}>Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <DialogActions sx={{ mt: 2 }}>
                    <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                      {isEditMode ? 'Update' : 'Create'}
                    </Button>
                  </DialogActions>
                </form>
              </DialogContent>
            </Dialog>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            {/* Reports Dashboard */}
            <GlassPaper>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">System Reports</Typography>
                {/* <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PictureAsPdf />}
                    onClick={() => setPdfDialogOpen(true)}
                  >
                    Generate PDF Report
                  </Button>
                </Box> */}
              </Box>

              {/* Summary Statistics */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <GlassPaper>
                    <Typography variant="h6" gutterBottom>
                      User Statistics
                    </Typography>
                    <Box>
                      <InfoRow label="Total Users" value={stats.totalUsers} />
                      <InfoRow label="Approved Users" value={stats.approvedUsers} />
                      <InfoRow label="Pending Users" value={stats.pendingUsers} />
                    </Box>
                  </GlassPaper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <GlassPaper>
                    <Typography variant="h6" gutterBottom>
                      Category Statistics
                    </Typography>
                    <Box>
                      <InfoRow label="Total Categories" value={stats.totalCategories} />
                      <InfoRow label="Active Categories" value={stats.activeCategories} />
                      <InfoRow label="Inactive Categories" value={stats.totalCategories - stats.activeCategories} />
                    </Box>
                  </GlassPaper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <GlassPaper>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    <Box>
                      <InfoRow
                        label="New Users (Last 30 days)"
                        value={
                          users.filter(u =>
                            new Date(u.created_at) > new Date(new Date().setDate(new Date().getDate() - 30))
                          ).length
                        }
                      />
                      <InfoRow
                        label="Updated Categories (Last 30 days)"
                        value={
                          categories.filter(c =>
                            new Date(c.updated_at) > new Date(new Date().setDate(new Date().getDate() - 30))
                          ).length
                        }
                      />
                    </Box>

                  </GlassPaper>
                </Grid>
              </Grid>

              {/* Data Tables */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <GlassPaper>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" gutterBottom>
                        Recent Users
                      </Typography>
                      <Box display="flex" gap={1}>
                        <DatePicker
                          selected={reportConfig.usersStartDate || reportConfig.startDate}
                          onChange={(date) => setReportConfig({ ...reportConfig, usersStartDate: date })}
                          selectsStart
                          startDate={reportConfig.usersStartDate || reportConfig.startDate}
                          endDate={reportConfig.usersEndDate || reportConfig.endDate}
                          customInput={
                            <TextField
                              size="small"
                              sx={{ width: 120 }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <FilterAlt fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          }
                        />
                        <DatePicker
                          selected={reportConfig.usersEndDate || reportConfig.endDate}
                          onChange={(date) => setReportConfig({ ...reportConfig, usersEndDate: date })}
                          selectsEnd
                          startDate={reportConfig.usersStartDate || reportConfig.startDate}
                          endDate={reportConfig.usersEndDate || reportConfig.endDate}
                          minDate={reportConfig.usersStartDate || reportConfig.startDate}
                          customInput={
                            <TextField
                              size="small"
                              sx={{ width: 120 }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <FilterAlt fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          }
                        />
                        <PDFDownloadLink
                          document={
                            <PDFDocument
                              data={{
                                title: 'Recent Users Report',
                                users: users.filter(user => {
                                  const userDate = new Date(user.created_at);
                                  const startDate = reportConfig.usersStartDate || reportConfig.startDate;
                                  const endDate = reportConfig.usersEndDate || reportConfig.endDate;
                                  return userDate >= startDate && userDate <= endDate;
                                }),
                                type: 'users'
                              }}
                              config={{
                                title: 'Recent Users Report',
                                includeTables: true
                              }}
                            />
                          }
                          fileName="recent_users_report.pdf"
                        >
                          {({ loading }) => (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PictureAsPdf />}
                              disabled={loading}
                            >
                              {loading ? '...' : 'PDF'}
                            </Button>
                          )}
                        </PDFDownloadLink>
                      </Box>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {users
                            .filter(user => {
                              const userDate = new Date(user.created_at);
                              const startDate = reportConfig.usersStartDate || reportConfig.startDate;
                              const endDate = reportConfig.usersEndDate || reportConfig.endDate;
                              return userDate >= startDate && userDate <= endDate;
                            })
                            .slice(0, 5)
                            .map(user => (
                              <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={user.isApproved ? 'Approved' : 'Pending'}
                                    size="small"
                                    color={user.isApproved ? 'success' : 'warning'}
                                  />
                                </TableCell>
                                <TableCell>
                                  {new Date(user.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </GlassPaper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <GlassPaper>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" gutterBottom>
                        Recent Categories
                      </Typography>
                      <Box display="flex" gap={1}>
                        <DatePicker
                          selected={reportConfig.categoriesStartDate || reportConfig.startDate}
                          onChange={(date) => setReportConfig({ ...reportConfig, categoriesStartDate: date })}
                          selectsStart
                          startDate={reportConfig.categoriesStartDate || reportConfig.startDate}
                          endDate={reportConfig.categoriesEndDate || reportConfig.endDate}
                          customInput={
                            <TextField
                              size="small"
                              sx={{ width: 120 }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <FilterAlt fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          }
                        />
                        <DatePicker
                          selected={reportConfig.categoriesEndDate || reportConfig.endDate}
                          onChange={(date) => setReportConfig({ ...reportConfig, categoriesEndDate: date })}
                          selectsEnd
                          startDate={reportConfig.categoriesStartDate || reportConfig.startDate}
                          endDate={reportConfig.categoriesEndDate || reportConfig.endDate}
                          minDate={reportConfig.categoriesStartDate || reportConfig.startDate}
                          customInput={
                            <TextField
                              size="small"
                              sx={{ width: 120 }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <FilterAlt fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          }
                        />
                        <PDFDownloadLink
                          document={
                            <PDFDocument
                              data={{
                                title: 'Recent Categories Report',
                                categories: categories.filter(category => {
                                  const categoryDate = new Date(category.created_at);
                                  const startDate = reportConfig.categoriesStartDate || reportConfig.startDate;
                                  const endDate = reportConfig.categoriesEndDate || reportConfig.endDate;
                                  return categoryDate >= startDate && categoryDate <= endDate;
                                }),
                                type: 'categories'
                              }}
                              config={{
                                title: 'Recent Categories Report',
                                includeTables: true
                              }}
                            />
                          }
                          fileName="recent_categories_report.pdf"
                        >
                          {({ loading }) => (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PictureAsPdf />}
                              disabled={loading}
                            >
                              {loading ? '...' : 'PDF'}
                            </Button>
                          )}
                        </PDFDownloadLink>
                      </Box>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Rate</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categories
                            .filter(category => {
                              const categoryDate = new Date(category.created_at);
                              const startDate = reportConfig.categoriesStartDate || reportConfig.startDate;
                              const endDate = reportConfig.categoriesEndDate || reportConfig.endDate;
                              return categoryDate >= startDate && categoryDate <= endDate;
                            })
                            .slice(0, 5)
                            .map(category => (
                              <TableRow key={category.id}>
                                <TableCell>{category.name}</TableCell>
                                <TableCell>{category.tax_percentage}%</TableCell>
                                <TableCell>
                                  <Chip
                                    label={category.is_active ? 'Active' : 'Inactive'}
                                    size="small"
                                    color={category.is_active ? 'success' : 'error'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </GlassPaper>
                </Grid>
              </Grid>
            </GlassPaper>
          </Box>
        )}
      </Container>

      {/* PDF Generation Dialog */}
      <Dialog open={pdfDialogOpen} onClose={() => setPdfDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate PDF Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <DatePicker
                  selected={reportConfig.startDate}
                  onChange={(date) => setReportConfig({ ...reportConfig, startDate: date })}
                  customInput={<CustomDatePickerInput label="Start Date" />}
                  selectsStart
                  startDate={reportConfig.startDate}
                  endDate={reportConfig.endDate}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <DatePicker
                  selected={reportConfig.endDate}
                  onChange={(date) => setReportConfig({ ...reportConfig, endDate: date })}
                  customInput={<CustomDatePickerInput label="End Date" />}
                  selectsEnd
                  startDate={reportConfig.startDate}
                  endDate={reportConfig.endDate}
                  minDate={reportConfig.startDate}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportConfig.reportType}
                  onChange={(e) => setReportConfig({ ...reportConfig, reportType: e.target.value })}
                  label="Report Type"
                >
                  <SelectMenuItem value="summary">Summary Report</SelectMenuItem>
                  <SelectMenuItem value="detailed">Detailed Report</SelectMenuItem>
                  <SelectMenuItem value="custom">Custom Report</SelectMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Report Sections</InputLabel>
                <Select
                  multiple
                  value={Object.keys(pdfConfig).filter(key => pdfConfig[key])}
                  onChange={(e) => {
                    const newConfig = { ...pdfConfig };
                    Object.keys(pdfConfig).forEach(key => {
                      newConfig[key] = e.target.value.includes(key);
                    });
                    setPdfConfig(newConfig);
                  }}
                  renderValue={(selected) => selected.join(', ')}
                >
                  <SelectMenuItem value="includeCharts">Include Charts</SelectMenuItem>
                  <SelectMenuItem value="includeTables">Include Data Tables</SelectMenuItem>
                  <SelectMenuItem value="includeUserDetails">Include User Details</SelectMenuItem>
                  <SelectMenuItem value="includeCategoryDetails">Include Category Details</SelectMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <TextField
                  label="Report Title"
                  value={pdfConfig.title}
                  onChange={(e) => setPdfConfig({ ...pdfConfig, title: e.target.value })}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <TextareaAutosize
                  minRows={3}
                  placeholder="Additional notes for the report..."
                  style={{ width: '100%', padding: '8px' }}
                />
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdfDialogOpen(false)}>Cancel</Button>
          <PDFDownloadLink
            document={
              <PDFDocument
                data={generateReportData()}
                config={pdfConfig}
                reportConfig={reportConfig}
              />
            }
            fileName="admin_report.pdf"
          >
            {({ loading }) => (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PictureAsPdf />}
                disabled={loading}
              >
                {loading ? 'Preparing document...' : 'Download PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;






































































// 2nd UI


// import React, { useState, useEffect } from 'react';
// import { styled, alpha } from '@mui/material/styles';
// import {
//   AppBar, Toolbar, Typography, Container, Paper, Tabs, Tab, Box,
//   TextField, Table, TableBody, TableCell, TableContainer, TableHead,
//   TableRow, Chip, Grid, IconButton, Menu, MenuItem, Avatar,
//   useTheme, useMediaQuery, LinearProgress, Snackbar, Alert,
//   Card, CardContent, Divider, Button, InputAdornment, Dialog,
//   DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
//   Select, MenuItem as SelectMenuItem, TextareaAutosize, Badge
// } from '@mui/material';
// import {
//   People, CheckCircle, Pending, PersonAdd, Logout,
//   DarkMode, LightMode, Menu as MenuIcon, Search,
//   Check, Close, Edit, Delete, Refresh, Category,
//   InsertChart, PictureAsPdf, DateRange, FilterAlt,
//   Visibility, ArrowDropDown, ArrowRight, Add, MoreVert,
//   Mail, Phone, Person, Public, CalendarToday, CreditCard, Home
// } from '@mui/icons-material';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import { PDFDownloadLink } from '@react-pdf/renderer';
// import { PDFDocument } from './PDFDocument.js';
// import api from '../../api';
// import { useNavigate } from 'react-router-dom';

// // Enhanced Styled Components
// const GlassPaper = styled(Paper)(({ theme }) => ({
//   background: alpha(theme.palette.background.paper, 0.85),
//   backdropFilter: 'blur(12px)',
//   border: '1px solid',
//   borderColor: alpha(theme.palette.divider, 0.2),
//   borderRadius: '16px',
//   boxShadow: theme.shadows[3],
//   padding: theme.spacing(3),
//   marginBottom: theme.spacing(3),
//   transition: 'all 0.3s ease',
//   '&:hover': {
//     boxShadow: theme.shadows[6],
//     transform: 'translateY(-2px)'
//   }
// }));

// const PrimaryButton = styled(Button)(({ theme }) => ({
//   background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
//   color: theme.palette.primary.contrastText,
//   fontWeight: 600,
//   padding: '8px 20px',
//   borderRadius: '10px',
//   textTransform: 'none',
//   '&:hover': {
//     boxShadow: theme.shadows[4],
//     transform: 'translateY(-1px)'
//   }
// }));

// const SecondaryButton = styled(Button)(({ theme }) => ({
//   border: `1px solid ${theme.palette.divider}`,
//   color: theme.palette.text.primary,
//   fontWeight: 500,
//   padding: '8px 16px',
//   borderRadius: '10px',
//   textTransform: 'none',
//   '&:hover': {
//     backgroundColor: alpha(theme.palette.primary.main, 0.05),
//     borderColor: theme.palette.primary.main
//   }
// }));

// // Enhanced reusable components
// const SectionHeader = ({ title, action }) => {
//   const theme = useTheme();
//   return (
//     <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
//       <Typography variant="h6" sx={{ 
//         fontWeight: 700,
//         color: 'text.primary',
//         position: 'relative',
//         '&:after': {
//           content: '""',
//           position: 'absolute',
//           bottom: -8,
//           left: 0,
//           width: '40px',
//           height: '4px',
//           background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
//           borderRadius: '2px'
//         }
//       }}>
//         {title}
//       </Typography>
//       {action && action}
//     </Box>
//   );
// };

// const InfoRow = ({ label, value, icon }) => {
//   const theme = useTheme();
//   return (
//     <Box sx={{ 
//       mb: 2,
//       display: 'flex',
//       alignItems: 'center',
//       gap: 2
//     }}>
//       {icon && (
//         <Box sx={{
//           width: 36,
//           height: 36,
//           borderRadius: '50%',
//           backgroundColor: alpha(theme.palette.primary.main, 0.1),
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           color: theme.palette.primary.main
//         }}>
//           {icon}
//         </Box>
//       )}
//       <Box>
//         <Typography variant="body2" sx={{
//           fontWeight: 500,
//           color: 'text.secondary',
//           mb: 0.5
//         }}>
//           {label}
//         </Typography>
//         <Typography variant="body1" sx={{ fontWeight: 600 }}>
//           {value || '-'}
//         </Typography>
//       </Box>
//     </Box>
//   );
// };

// const StatusBadge = ({ status }) => {
//   const theme = useTheme();
//   const statusConfig = {
//     active: { color: 'success', label: 'Active' },
//     inactive: { color: 'error', label: 'Inactive' },
//     approved: { color: 'success', label: 'Approved' },
//     pending: { color: 'warning', label: 'Pending' }
//   };

//   const currentStatus = statusConfig[status.toLowerCase()] || statusConfig.inactive;

//   return (
//     <Chip
//       label={currentStatus.label}
//       size="small"
//       sx={{
//         borderRadius: '6px',
//         fontWeight: 600,
//         backgroundColor: alpha(theme.palette[currentStatus.color].main, 0.1),
//         color: theme.palette[currentStatus.color].dark
//       }}
//     />
//   );
// };

// // Custom DatePicker input with better styling
// const CustomDatePickerInput = React.forwardRef(({ value, onClick, ...props }, ref) => {
//   const theme = useTheme();
//   return (
//     <TextField
//       fullWidth
//       size="small"
//       value={value}
//       onClick={onClick}
//       ref={ref}
//       InputProps={{
//         endAdornment: (
//           <InputAdornment position="end">
//             <DateRange color="action" />
//           </InputAdornment>
//         ),
//         sx: {
//           borderRadius: '10px',
//           backgroundColor: theme.palette.background.paper
//         }
//       }}
//       {...props}
//     />
//   );
// });

// const StatCard = ({ title, value, icon, color, trend }) => {
//   const theme = useTheme();
//   return (
//     <GlassPaper>
//       <CardContent sx={{ p: 2 }}>
//         <Box display="flex" justifyContent="space-between">
//           <Box>
//             <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
//               {title}
//             </Typography>
//             <Typography variant="h4" sx={{ fontWeight: 700 }}>
//               {value}
//             </Typography>
//             {trend && (
//               <Box display="flex" alignItems="center" mt={1}>
//                 <Typography 
//                   variant="caption" 
//                   sx={{ 
//                     color: trend.value > 0 ? theme.palette.success.main : theme.palette.error.main,
//                     fontWeight: 600
//                   }}
//                 >
//                   {trend.value > 0 ? '+' : ''}{trend.value}%
//                 </Typography>
//                 <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>
//                   vs last period
//                 </Typography>
//               </Box>
//             )}
//           </Box>
//           <Box
//             sx={{
//               backgroundColor: alpha(theme.palette[color].main, 0.1),
//               color: theme.palette[color].main,
//               borderRadius: '12px',
//               width: 48,
//               height: 48,
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center'
//             }}
//           >
//             {React.cloneElement(icon, { fontSize: "medium" })}
//           </Box>
//         </Box>
//       </CardContent>
//     </GlassPaper>
//   );
// };

// const EnhancedTableHead = ({ headers }) => {
//   return (
//     <TableHead>
//       <TableRow>
//         {headers.map((header, index) => (
//           <TableCell 
//             key={index} 
//             sx={{ 
//               fontWeight: 600,
//               color: 'text.secondary',
//               borderBottom: 'none'
//             }}
//           >
//             {header}
//           </TableCell>
//         ))}
//       </TableRow>
//     </TableHead>
//   );
// };

// const ActionMenu = ({ actions }) => {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const open = Boolean(anchorEl);
//   const theme = useTheme();

//   const handleClick = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleClose = () => {
//     setAnchorEl(null);
//   };

//   return (
//     <>
//       <IconButton
//         aria-label="more"
//         aria-controls="action-menu"
//         aria-haspopup="true"
//         onClick={handleClick}
//       >
//         <MoreVert />
//       </IconButton>
//       <Menu
//         id="action-menu"
//         anchorEl={anchorEl}
//         keepMounted
//         open={open}
//         onClose={handleClose}
//         PaperProps={{
//           sx: {
//             borderRadius: '12px',
//             boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//             minWidth: '180px'
//           }
//         }}
//       >
//         {actions.map((action, index) => (
//           <MenuItem 
//             key={index} 
//             onClick={() => {
//               action.handler();
//               handleClose();
//             }}
//             sx={{
//               '&:hover': {
//                 backgroundColor: alpha(theme.palette.primary.main, 0.1)
//               }
//             }}
//           >
//             <Box display="flex" alignItems="center" gap={1}>
//               {action.icon}
//               <Typography variant="body2">{action.label}</Typography>
//             </Box>
//           </MenuItem>
//         ))}
//       </Menu>
//     </>
//   );
// };

// const AdminDashboard = () => {
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
//   const navigate = useNavigate();

//   // State management
//   const [activeTab, setActiveTab] = useState(0);
//   const [users, setUsers] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
//   const [currentCategory, setCurrentCategory] = useState({
//     id: null,
//     name: '',
//     description: '',
//     tax_percentage: '',
//     is_active: 1
//   });
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [stats, setStats] = useState({
//     totalUsers: 0,
//     approvedUsers: 0,
//     pendingUsers: 0,
//     totalCategories: 0,
//     activeCategories: 0,
//     userGrowth: 12.5,
//     categoryGrowth: 8.3
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [reportConfig, setReportConfig] = useState({
//     startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
//     endDate: new Date(),
//     reportType: 'summary',
//     filters: {}
//   });
//   const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
//   const [pdfConfig, setPdfConfig] = useState({
//     title: 'Admin Report',
//     includeCharts: true,
//     includeTables: true
//   });
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [expandedRows, setExpandedRows] = useState([]);

//   const toggleRowExpansion = (id) => {
//     if (expandedRows.includes(id)) {
//       setExpandedRows(expandedRows.filter(rowId => rowId !== id));
//     } else {
//       setExpandedRows([...expandedRows, id]);
//     }
//   };

//   const handleViewDetails = (user) => {
//     setSelectedUser(user);
//     setOpenDialog(true);
//   };

//   // Fetch all data
//   const fetchData = async () => {
//     try {
//       setLoading(true);

//       // Fetch users
//       const usersResponse = await api.get('/api/users');
//       setUsers(usersResponse.data);

//       // Calculate statistics
//       const totalUsers = usersResponse.data.length;
//       const approvedUsers = usersResponse.data.filter(u => u.isApproved === 1).length;

//       setStats(prev => ({
//         ...prev,
//         totalUsers,
//         approvedUsers,
//         pendingUsers: totalUsers - approvedUsers
//       }));

//       // Fetch categories
//       const categoriesResponse = await api.get('/api/tax-categories');
//       setCategories(categoriesResponse.data);

//       // Update category stats
//       const totalCategories = categoriesResponse.data.length;
//       const activeCategories = categoriesResponse.data.filter(c => c.is_active).length;

//       setStats(prev => ({
//         ...prev,
//         totalCategories,
//         activeCategories
//       }));

//       setError(null);
//     } catch (err) {
//       handleApiError(err, 'Failed to fetch data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle user approval
//   const handleApproveUser = async (userId, approve) => {
//     try {
//       const endpoint = approve ? 'approve' : 'reject';
//       await api.patch(`/api/users/${endpoint}/${userId}`);
//       setSuccess(`User ${approve ? 'approved' : 'rejected'} successfully!`);
//       fetchData();
//     } catch (err) {
//       handleApiError(err, `Failed to ${approve ? 'approve' : 'reject'} user`);
//     }
//   };

//   // Handle category status toggle
//   const toggleCategoryStatus = async (category) => {
//     try {
//       const updatedCategory = { ...category, is_active: !category.is_active };
//       const response = await api.put(`/api/tax-categories/${category.id}`, updatedCategory);
//       setCategories(categories.map(cat =>
//         cat.id === category.id ? response.data : cat
//       ));
//       setSuccess(`Category ${updatedCategory.is_active ? 'activated' : 'deactivated'}!`);

//       // Update stats
//       const activeCategories = updatedCategory.is_active ?
//         stats.activeCategories + 1 : stats.activeCategories - 1;
//       setStats(prev => ({
//         ...prev,
//         activeCategories
//       }));
//     } catch (err) {
//       handleApiError(err, 'Failed to update category status');
//     }
//   };

//   // Generate report data from existing state
//   const generateReportData = () => {
//     const userRegistrations = users.map(user => ({
//       date: new Date(user.created_at).toLocaleDateString(),
//       count: 1
//     }));

//     const categoryUsage = categories.map(category => ({
//       name: category.name,
//       count: category.tax_percentage
//     }));

//     return {
//       userRegistrations,
//       categoryUsage,
//       stats
//     };
//   };

//   // Handle API errors
//   const handleApiError = (err, defaultMessage) => {
//     const errorMessage = err.response?.data?.message || defaultMessage;
//     setError(errorMessage);
//     console.error(errorMessage, err);

//     if (err.response?.status === 401) {
//       authApi.logout();
//     }
//   };

//   // API functions
//   const authApi = {
//     logout: () => {
//       localStorage.removeItem('token');
//       navigate('/');
//     },
//   };

//   // Filter users based on search term
//   const filteredUsers = users.filter(user =>
//     user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.email?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // Filter categories based on search term
//   const filteredCategories = categories.filter(category =>
//     category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     category.description?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const CategoryFormDialog = React.memo(() => {
//     const [submitting, setSubmitting] = useState(false);
//     const theme = useTheme();
    
//     const handleInputChange = (e) => {
//       const { name, value } = e.target;
//       setCurrentCategory(prev => ({
//         ...prev,
//         [name]: value
//       }));
//     };
  
//     const handleSubmit = async (e) => {
//       e.preventDefault();
//       setSubmitting(true);
      
//       try {
//         const categoryData = {
//           name: currentCategory.name,
//           description: currentCategory.description,
//           tax_percentage: parseFloat(currentCategory.tax_percentage),
//           is_active: currentCategory.is_active
//         };
  
//         if (isEditMode) {
//           await api.put(`/api/tax-categories/${currentCategory.id}`, categoryData);
//           setSuccess('Category updated successfully!');
//         } else {
//           await api.post('/api/tax-categories', categoryData);
//           setSuccess('Category created successfully!');
//         }
        
//         setCategoryDialogOpen(false);
//         fetchData();
//       } catch (err) {
//         handleApiError(err, `Failed to ${isEditMode ? 'update' : 'create'} category`);
//       } finally {
//         setSubmitting(false);
//       }
//     };
  
//     return (
//       <Dialog
//         open={categoryDialogOpen}
//         onClose={() => setCategoryDialogOpen(false)}
//         maxWidth="sm"
//         fullWidth
//         PaperProps={{
//           sx: {
//             borderRadius: '16px',
//             background: theme.palette.background.paper
//           }
//         }}
//       >
//         <DialogTitle sx={{
//           background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
//           color: 'white',
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           py: 2,
//           borderTopLeftRadius: 'inherit',
//           borderTopRightRadius: 'inherit'
//         }}>
//           <Typography variant="h6" sx={{ fontWeight: 600 }}>
//             {isEditMode ? 'Edit Tax Category' : 'Add New Tax Category'}
//           </Typography>
//           <IconButton 
//             onClick={() => setCategoryDialogOpen(false)} 
//             sx={{ 
//               color: 'white',
//               '&:hover': {
//                 backgroundColor: alpha(theme.palette.common.white, 0.1)
//               }
//             }}
//           >
//             <Close />
//           </IconButton>
//         </DialogTitle>
    
//         <DialogContent sx={{ p: 3 }}>
//           <form onSubmit={handleSubmit}>
//             <Grid container spacing={2}>
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   name="name"
//                   label="Category Name"
//                   value={currentCategory.name || ''}
//                   onChange={handleInputChange}
//                   required
//                   margin="normal"
//                   sx={{
//                     '& .MuiOutlinedInput-root': {
//                       borderRadius: '10px'
//                     }
//                   }}
//                 />
//               </Grid>
              
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   name="tax_percentage"
//                   label="Tax Percentage"
//                   type="number"
//                   value={currentCategory.tax_percentage || ''}
//                   onChange={handleInputChange}
//                   required
//                   margin="normal"
//                   InputProps={{
//                     endAdornment: <InputAdornment position="end">%</InputAdornment>,
//                     sx: {
//                       borderRadius: '10px'
//                     }
//                   }}
//                 />
//               </Grid>
              
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   name="description"
//                   label="Description"
//                   value={currentCategory.description || ''}
//                   onChange={handleInputChange}
//                   multiline
//                   rows={4}
//                   margin="normal"
//                   sx={{
//                     '& .MuiOutlinedInput-root': {
//                       borderRadius: '10px'
//                     }
//                   }}
//                 />
//               </Grid>
              
//               <Grid item xs={12}>
//                 <FormControl fullWidth margin="normal">
//                   <InputLabel>Status</InputLabel>
//                   <Select
//                     name="is_active"
//                     value={currentCategory.is_active || 1}
//                     onChange={handleInputChange}
//                     label="Status"
//                     sx={{
//                       borderRadius: '10px'
//                     }}
//                   >
//                     <MenuItem value={1}>Active</MenuItem>
//                     <MenuItem value={0}>Inactive</MenuItem>
//                   </Select>
//                 </FormControl>
//               </Grid>
//             </Grid>
            
//             <DialogActions sx={{ mt: 2, px: 0 }}>
//               <SecondaryButton onClick={() => setCategoryDialogOpen(false)}>
//                 Cancel
//               </SecondaryButton>
//               <PrimaryButton type="submit" disabled={submitting}>
//                 {submitting ? 'Processing...' : (isEditMode ? 'Update Category' : 'Create Category')}
//               </PrimaryButton>
//             </DialogActions>
//           </form>
//         </DialogContent>
//       </Dialog>
//     );
//   });

//   const handleAddCategory = () => {
//     setCurrentCategory({
//       id: null,
//       name: '',
//       description: '',
//       tax_percentage: '',
//       is_active: 1
//     });
//     setIsEditMode(false);
//     setCategoryDialogOpen(true);
//   };
  
//   const handleEditCategory = (category) => {
//     setCurrentCategory({
//       id: category.id,
//       name: category.name,
//       description: category.description,
//       tax_percentage: category.tax_percentage,
//       is_active: category.is_active
//     });
//     setIsEditMode(true);
//     setCategoryDialogOpen(true);
//   };
  
//   const handleDeleteCategory = async (categoryId) => {
//     try {
//       await api.delete(`/api/tax-categories/${categoryId}`);
//       setSuccess('Category deleted successfully!');
//       fetchData();
//     } catch (err) {
//       handleApiError(err, 'Failed to delete category');
//     }
//   };

//   // Set up interceptors and initial data fetch
//   useEffect(() => {
//     const requestInterceptor = api.interceptors.request.use(
//       config => {
//         const token = localStorage.getItem('token');
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       error => Promise.reject(error)
//     );

//     fetchData();

//     return () => {
//       api.interceptors.request.eject(requestInterceptor);
//     };
//   }, [navigate]);

//   return (
//     <Box sx={{
//       display: 'flex',
//       flexDirection: 'column',
//       minHeight: '100vh',
//       background: theme.palette.background.default
//     }}>
//       {/* Enhanced App Bar */}
//       <AppBar 
//         position="static" 
//         elevation={0} 
//         sx={{
//           background: theme.palette.mode === 'dark' 
//             ? alpha(theme.palette.background.paper, 0.8) 
//             : alpha(theme.palette.background.paper, 0.95),
//           backdropFilter: 'blur(20px)',
//           borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
//           boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
//         }}
//       >
//         <Toolbar>
//           {isMobile && (
//             <IconButton 
//               edge="start" 
//               color="inherit" 
//               sx={{ 
//                 mr: 2,
//                 '&:hover': {
//                   backgroundColor: alpha(theme.palette.primary.main, 0.1)
//                 }
//               }}
//             >
//               <MenuIcon />
//             </IconButton>
//           )}

//           <Typography 
//             variant="h6" 
//             component="div" 
//             sx={{
//               flexGrow: 1,
//               fontWeight: 700,
//               letterSpacing: '0.5px',
//               background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
//               WebkitBackgroundClip: 'text',
//               WebkitTextFillColor: 'transparent'
//             }}
//           >
//             Admin Dashboard
//           </Typography>

//           <Box display="flex" alignItems="center" gap={1}>
//             <TextField
//               size="small"
//               placeholder="Search..."
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Search color="action" />
//                   </InputAdornment>
//                 ),
//                 sx: {
//                   borderRadius: '10px',
//                   backgroundColor: 'background.paper'
//                 }
//               }}
//               sx={{ 
//                 width: isMobile ? '150px' : '250px',
//                 mr: 1
//               }}
//             />
            
//             <IconButton 
//               color="inherit" 
//               onClick={(e) => setAnchorEl(e.currentTarget)}
//               sx={{
//                 backgroundColor: alpha(theme.palette.primary.main, 0.1),
//                 '&:hover': {
//                   backgroundColor: alpha(theme.palette.primary.main, 0.2)
//                 }
//               }}
//             >
//               <Avatar 
//                 sx={{
//                   width: 32,
//                   height: 32,
//                   background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
//                   color: 'white',
//                   fontSize: '0.875rem'
//                 }}
//               >
//                 A
//               </Avatar>
//             </IconButton>

//             <Menu
//               anchorEl={anchorEl}
//               open={Boolean(anchorEl)}
//               onClose={() => setAnchorEl(null)}
//               PaperProps={{
//                 sx: {
//                   mt: 1.5,
//                   borderRadius: '12px',
//                   boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//                   minWidth: '200px'
//                 }
//               }}
//             >
//               <MenuItem 
//                 onClick={authApi.logout}
//                 sx={{
//                   '&:hover': {
//                     backgroundColor: alpha(theme.palette.primary.main, 0.1)
//                   }
//                 }}
//               >
//                 <Box display="flex" alignItems="center" gap={1}>
//                   <Logout fontSize="small" />
//                   <Typography variant="body2">Logout</Typography>
//                 </Box>
//               </MenuItem>
//             </Menu>
//           </Box>
//         </Toolbar>
//       </AppBar>

//       <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
//         {/* Loading Indicator */}
//         {loading && (
//           <LinearProgress 
//             sx={{ 
//               mb: 2,
//               borderRadius: '4px',
//               height: '6px',
//               background: alpha(theme.palette.primary.main, 0.1),
//               '& .MuiLinearProgress-bar': {
//                 background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
//               }
//             }} 
//           />
//         )}

//         {/* Notifications */}
//         <Snackbar 
//           open={!!error} 
//           autoHideDuration={6000} 
//           onClose={() => setError(null)}
//           anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
//         >
//           <Alert 
//             severity="error" 
//             sx={{ 
//               width: '100%',
//               borderRadius: '12px',
//               boxShadow: theme.shadows[3]
//             }}
//           >
//             {error}
//           </Alert>
//         </Snackbar>

//         <Snackbar 
//           open={!!success} 
//           autoHideDuration={4000} 
//           onClose={() => setSuccess(null)}
//           anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
//         >
//           <Alert 
//             severity="success" 
//             sx={{ 
//               width: '100%',
//               borderRadius: '12px',
//               boxShadow: theme.shadows[3]
//             }}
//           >
//             {success}
//           </Alert>
//         </Snackbar>

//         {/* Main Content */}
//         <GlassPaper>
//           <Tabs
//             value={activeTab}
//             onChange={(e, newValue) => setActiveTab(newValue)}
//             variant={isMobile ? 'scrollable' : 'standard'}
//             scrollButtons="auto"
//             textColor="primary"
//             indicatorColor="primary"
//             sx={{
//               '& .MuiTabs-indicator': {
//                 height: '4px',
//                 borderRadius: '2px'
//               }
//             }}
//           >
//             <Tab 
//               label="Users" 
//               icon={<People />} 
//               iconPosition="start" 
//               sx={{ 
//                 minHeight: '48px',
//                 textTransform: 'none',
//                 fontWeight: 600
//               }} 
//             />
//             <Tab 
//               label="Tax Categories" 
//               icon={<Category />} 
//               iconPosition="start" 
//               sx={{ 
//                 minHeight: '48px',
//                 textTransform: 'none',
//                 fontWeight: 600
//               }} 
//             />
//             <Tab 
//               label="Reports" 
//               icon={<InsertChart />} 
//               iconPosition="start" 
//               sx={{ 
//                 minHeight: '48px',
//                 textTransform: 'none',
//                 fontWeight: 600
//               }} 
//             />
//           </Tabs>
//         </GlassPaper>

//         {activeTab === 0 && (
//           <Box>
//             {/* User Statistics Cards */}
//             <Grid container spacing={3} sx={{ mb: 3 }}>
//               <Grid item xs={12} md={4}>
//                 <StatCard
//                   title="Total Users"
//                   value={stats.totalUsers}
//                   icon={<People />}
//                   color="primary"
//                   trend={{ value: stats.userGrowth }}
//                 />
//               </Grid>
//               <Grid item xs={12} md={4}>
//                 <StatCard
//                   title="Approved Users"
//                   value={stats.approvedUsers}
//                   icon={<CheckCircle />}
//                   color="success"
//                 />
//               </Grid>
//               <Grid item xs={12} md={4}>
//                 <StatCard
//                   title="Pending Approval"
//                   value={stats.pendingUsers}
//                   icon={<Pending />}
//                   color="warning"
//                 />
//               </Grid>
//             </Grid>

//             {/* User Management */}
//             <GlassPaper>
//               <SectionHeader 
//                 title="User Management" 
//                 action={
//                   <Box display="flex" gap={2}>
//                     <TextField
//                       size="small"
//                       placeholder="Search users..."
//                       InputProps={{
//                         startAdornment: (
//                           <InputAdornment position="start">
//                             <Search color="action" />
//                           </InputAdornment>
//                         ),
//                         sx: {
//                           borderRadius: '10px',
//                           backgroundColor: 'background.paper'
//                         }
//                       }}
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       sx={{ width: isMobile ? '150px' : '250px' }}
//                     />
//                     <SecondaryButton
//                       startIcon={<Refresh />}
//                       onClick={fetchData}
//                     >
//                       Refresh
//                     </SecondaryButton>
//                   </Box>
//                 }
//               />

//               <TableContainer>
//                 <Table>
//                   <EnhancedTableHead 
//                     headers={['Name', 'Email', 'Status', 'Registered', 'Actions']}
//                   />
//                   <TableBody>
//                     {filteredUsers.map((user) => (
//                       <React.Fragment key={user.id}>
//                         <TableRow 
//                           hover 
//                           sx={{ 
//                             '&:hover': {
//                               backgroundColor: alpha(theme.palette.primary.main, 0.03)
//                             }
//                           }}
//                         >
//                           <TableCell>
//                             <Box display="flex" alignItems="center" gap={2}>
//                               <Avatar 
//                                 sx={{ 
//                                   width: 36, 
//                                   height: 36,
//                                   backgroundColor: alpha(theme.palette.primary.main, 0.1),
//                                   color: theme.palette.primary.main
//                                 }}
//                               >
//                                 {user.name.charAt(0)}
//                               </Avatar>
//                               <Typography variant="body1" fontWeight={500}>
//                                 {user.name}
//                               </Typography>
//                             </Box>
//                           </TableCell>
//                           <TableCell>
//                             <Typography variant="body2">
//                               {user.email}
//                             </Typography>
//                           </TableCell>
//                           <TableCell>
//                             <StatusBadge status={user.isApproved ? 'approved' : 'pending'} />
//                           </TableCell>
//                           <TableCell>
//                             <Typography variant="body2">
//                               {new Date(user.created_at).toLocaleDateString()}
//                             </Typography>
//                           </TableCell>
//                           <TableCell align="right">
//                             <Box display="flex" justifyContent="flex-end" gap={1}>
//                               <IconButton
//                                 size="small"
//                                 onClick={() => handleViewDetails(user)}
//                                 sx={{
//                                   backgroundColor: alpha(theme.palette.primary.main, 0.1),
//                                   '&:hover': {
//                                     backgroundColor: alpha(theme.palette.primary.main, 0.2)
//                                   }
//                                 }}
//                               >
//                                 <Visibility fontSize="small" color="primary" />
//                               </IconButton>
//                               <IconButton
//                                 size="small"
//                                 onClick={() => handleApproveUser(user.id, !user.isApproved)}
//                                 sx={{
//                                   backgroundColor: user.isApproved 
//                                     ? alpha(theme.palette.error.main, 0.1) 
//                                     : alpha(theme.palette.success.main, 0.1),
//                                   '&:hover': {
//                                     backgroundColor: user.isApproved 
//                                       ? alpha(theme.palette.error.main, 0.2) 
//                                       : alpha(theme.palette.success.main, 0.2)
//                                   }
//                                 }}
//                               >
//                                 {user.isApproved ? (
//                                   <Close fontSize="small" color="error" />
//                                 ) : (
//                                   <Check fontSize="small" color="success" />
//                                 )}
//                               </IconButton>
//                               <ActionMenu
//                                 actions={[
//                                   {
//                                     label: 'View Details',
//                                     icon: <Visibility fontSize="small" />,
//                                     handler: () => handleViewDetails(user)
//                                   },
//                                   {
//                                     label: user.isApproved ? 'Reject' : 'Approve',
//                                     icon: user.isApproved ? <Close fontSize="small" /> : <Check fontSize="small" />,
//                                     handler: () => handleApproveUser(user.id, !user.isApproved)
//                                   }
//                                 ]}
//                               />
//                             </Box>
//                           </TableCell>
//                         </TableRow>
//                       </React.Fragment>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </TableContainer>
//             </GlassPaper>

//             {/* User Details Dialog */}
//             <Dialog
//               open={openDialog}
//               onClose={() => setOpenDialog(false)}
//               maxWidth="md"
//               fullWidth
//               PaperProps={{
//                 sx: { 
//                   borderRadius: '16px',
//                   background: theme.palette.background.paper
//                 }
//               }}
//             >
//               <DialogTitle sx={{
//                 background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
//                 color: 'white',
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//                 py: 2,
//                 borderTopLeftRadius: 'inherit',
//                 borderTopRightRadius: 'inherit'
//               }}>
//                 <Typography variant="h6" sx={{ fontWeight: 600 }}>
//                   User Profile
//                 </Typography>
//                 <IconButton 
//                   onClick={() => setOpenDialog(false)} 
//                   sx={{ 
//                     color: 'white',
//                     '&:hover': {
//                       backgroundColor: alpha(theme.palette.common.white, 0.1)
//                     }
//                   }}
//                 >
//                   <Close />
//                 </IconButton>
//               </DialogTitle>

//               <DialogContent sx={{ p: 3 }}>
//                 {selectedUser && (
//                   <Grid container spacing={3}>
//                     <Grid item xs={12} md={6}>
//                       <SectionHeader title="Personal Information" />
//                       <InfoRow 
//                         label="Full Name" 
//                         value={selectedUser.name} 
//                         icon={<Person fontSize="small" />}
//                       />
//                       <InfoRow 
//                         label="Email" 
//                         value={selectedUser.email} 
//                         icon={<Mail fontSize="small" />}
//                       />
//                       <InfoRow 
//                         label="Contact Number" 
//                         value={selectedUser.contact_number} 
//                         icon={<Phone fontSize="small" />}
//                       />
//                       <InfoRow 
//                         label="Gender" 
//                         value={selectedUser.gender} 
//                         icon={<Person fontSize="small" />}
//                       />
//                       <InfoRow 
//                         label="Nationality" 
//                         value={selectedUser.nationality} 
//                         icon={<Public fontSize="small" />}
//                       />
//                     </Grid>

//                     <Grid item xs={12} md={6}>
//                       <SectionHeader title="Account Details" />
//                       <InfoRow 
//                         label="User Role" 
//                         value={selectedUser.role} 
//                         icon={<Badge fontSize="small" />}
//                       />
//                       <InfoRow 
//                         label="Registration Date"
//                         value={new Date(selectedUser.created_at).toLocaleString()} 
//                         icon={<CalendarToday fontSize="small" />}
//                       />
//                       <InfoRow 
//                         label="ID Number" 
//                         value={selectedUser.id_number} 
//                         icon={<CreditCard fontSize="small" />}
//                       />
//                       <InfoRow 
//                         label="Address" 
//                         value={selectedUser.address} 
//                         icon={<Home fontSize="small" />}
//                       />

//                       <Box mt={3}>
//                         <Typography variant="subtitle2" sx={{ mb: 1 }}>
//                           Account Status
//                         </Typography>
//                         <Box 
//                           sx={{ 
//                             display: 'inline-flex',
//                             alignItems: 'center',
//                             p: '6px 12px',
//                             borderRadius: '8px',
//                             backgroundColor: selectedUser.isApproved 
//                               ? alpha(theme.palette.success.main, 0.1) 
//                               : alpha(theme.palette.warning.main, 0.1),
//                             border: `1px solid ${selectedUser.isApproved 
//                               ? theme.palette.success.main 
//                               : theme.palette.warning.main}`
//                           }}
//                         >
//                           <Box
//                             sx={{
//                               width: '8px',
//                               height: '8px',
//                               borderRadius: '50%',
//                               backgroundColor: selectedUser.isApproved 
//                                 ? theme.palette.success.main 
//                                 : theme.palette.warning.main,
//                               mr: 1
//                             }}
//                           />
//                           <Typography 
//                             variant="body2" 
//                             sx={{ 
//                               fontWeight: 600,
//                               color: selectedUser.isApproved 
//                                 ? theme.palette.success.dark 
//                                 : theme.palette.warning.dark
//                             }}
//                           >
//                             {selectedUser.isApproved ? 'Approved' : 'Pending Approval'}
//                           </Typography>
//                         </Box>
//                       </Box>
//                     </Grid>
//                   </Grid>
//                 )}
//               </DialogContent>
//               <DialogActions sx={{ p: 3, pt: 0 }}>
//                 <SecondaryButton onClick={() => setOpenDialog(false)}>
//                   Close
//                 </SecondaryButton>
//                 <PrimaryButton 
//                   onClick={() => {
//                     handleApproveUser(selectedUser.id, !selectedUser.isApproved);
//                     setOpenDialog(false);
//                   }}
//                 >
//                   {selectedUser?.isApproved ? 'Reject User' : 'Approve User'}
//                 </PrimaryButton>
//               </DialogActions>
//             </Dialog>
//           </Box>
//         )}

//         {activeTab === 1 && (
//           <Box>
//             {/* Tax Categories Statistics */}
//             <Grid container spacing={3} sx={{ mb: 3 }}>
//               <Grid item xs={12} md={6}>
//                 <StatCard
//                   title="Total Categories"
//                   value={stats.totalCategories}
//                   icon={<Category />}
//                   color="info"
//                   trend={{ value: stats.categoryGrowth }}
//                 />
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <StatCard
//                   title="Active Categories"
//                   value={stats.activeCategories}
//                   icon={<CheckCircle />}
//                   color="success"
//                 />
//               </Grid>
//             </Grid>

//             {/* Tax Categories Management */}
//             <GlassPaper>
//               <SectionHeader 
//                 title="Tax Categories" 
//                 action={
//                   <Box display="flex" gap={2}>
//                     <TextField
//                       size="small"
//                       placeholder="Search categories..."
//                       InputProps={{
//                         startAdornment: (
//                           <InputAdornment position="start">
//                             <Search color="action" />
//                           </InputAdornment>
//                         ),
//                         sx: {
//                           borderRadius: '10px',
//                           backgroundColor: 'background.paper'
//                         }
//                       }}
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       sx={{ width: isMobile ? '150px' : '250px' }}
//                     />
//                     <PrimaryButton
//                       startIcon={<Add />}
//                       onClick={handleAddCategory}
//                     >
//                       Add Category
//                     </PrimaryButton>
//                     <SecondaryButton
//                       startIcon={<Refresh />}
//                       onClick={fetchData}
//                     >
//                       Refresh
//                     </SecondaryButton>
//                   </Box>
//                 }
//               />

//               <TableContainer>
//                 <Table>
//                   <EnhancedTableHead 
//                     headers={['Name', 'Tax Rate', 'Status', 'Description', 'Actions']}
//                   />
//                   <TableBody>
//                     {filteredCategories.map((category) => (
//                       <React.Fragment key={category.id}>
//                         <TableRow 
//                           hover 
//                           sx={{ 
//                             '&:hover': {
//                               backgroundColor: alpha(theme.palette.primary.main, 0.03)
//                             }
//                           }}
//                         >
//                           <TableCell>
//                             <Typography variant="body1" fontWeight={500}>
//                               {category.name}
//                             </Typography>
//                           </TableCell>
//                           <TableCell>
//                             <Box 
//                               sx={{ 
//                                 display: 'inline-flex',
//                                 alignItems: 'center',
//                                 p: '4px 8px',
//                                 borderRadius: '6px',
//                                 backgroundColor: alpha(theme.palette.primary.main, 0.1),
//                                 color: theme.palette.primary.dark
//                               }}
//                             >
//                               <Typography variant="body2" fontWeight={600}>
//                                 {category.tax_percentage}%
//                               </Typography>
//                             </Box>
//                           </TableCell>
//                           <TableCell>
//                             <StatusBadge status={category.is_active ? 'active' : 'inactive'} />
//                           </TableCell>
//                           <TableCell>
//                             <Typography variant="body2" color="textSecondary">
//                               {category.description || 'No description'}
//                             </Typography>
//                           </TableCell>
//                           <TableCell align="right">
//                             <Box display="flex" justifyContent="flex-end" gap={1}>
//                               <IconButton
//                                 size="small"
//                                 onClick={() => handleEditCategory(category)}
//                                 sx={{
//                                   backgroundColor: alpha(theme.palette.primary.main, 0.1),
//                                   '&:hover': {
//                                     backgroundColor: alpha(theme.palette.primary.main, 0.2)
//                                   }
//                                 }}
//                               >
//                                 <Edit fontSize="small" color="primary" />
//                               </IconButton>
//                               <IconButton
//                                 size="small"
//                                 onClick={() => toggleCategoryStatus(category)}
//                                 sx={{
//                                   backgroundColor: category.is_active 
//                                     ? alpha(theme.palette.error.main, 0.1) 
//                                     : alpha(theme.palette.success.main, 0.1),
//                                   '&:hover': {
//                                     backgroundColor: category.is_active 
//                                       ? alpha(theme.palette.error.main, 0.2) 
//                                       : alpha(theme.palette.success.main, 0.2)
//                                   }
//                                 }}
//                               >
//                                 {category.is_active ? (
//                                   <Close fontSize="small" color="error" />
//                                 ) : (
//                                   <Check fontSize="small" color="success" />
//                                 )}
//                               </IconButton>
//                               <ActionMenu
//                                 actions={[
//                                   {
//                                     label: 'Edit',
//                                     icon: <Edit fontSize="small" />,
//                                     handler: () => handleEditCategory(category)
//                                   },
//                                   {
//                                     label: category.is_active ? 'Deactivate' : 'Activate',
//                                     icon: category.is_active ? <Close fontSize="small" /> : <Check fontSize="small" />,
//                                     handler: () => toggleCategoryStatus(category)
//                                   },
//                                   {
//                                     label: 'Delete',
//                                     icon: <Delete fontSize="small" color="error" />,
//                                     handler: () => handleDeleteCategory(category.id)
//                                   }
//                                 ]}
//                               />
//                             </Box>
//                           </TableCell>
//                         </TableRow>
//                       </React.Fragment>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </TableContainer>
//             </GlassPaper>

//             {/* Render the category form dialog */}
//             <CategoryFormDialog />
//           </Box>
//         )}

//         {activeTab === 2 && (
//           <Box>
//             {/* Reports Dashboard */}
//             <GlassPaper>
//               <SectionHeader 
//                 title="System Reports" 
//                 action={
//                   <PrimaryButton
//                     startIcon={<PictureAsPdf />}
//                     onClick={() => setPdfDialogOpen(true)}
//                   >
//                     Generate PDF
//                   </PrimaryButton>
//                 }
//               />

//               {/* Summary Statistics */}
//               <Grid container spacing={3} sx={{ mb: 3 }}>
//                 <Grid item xs={12} md={4}>
//                   <GlassPaper>
//                     <SectionHeader title="User Statistics" />
//                     <Box>
//                       <InfoRow label="Total Users" value={stats.totalUsers} icon={<People fontSize="small" />} />
//                       <InfoRow label="Approved Users" value={stats.approvedUsers} icon={<CheckCircle fontSize="small" />} />
//                       <InfoRow label="Pending Users" value={stats.pendingUsers} icon={<Pending fontSize="small" />} />
//                     </Box>
//                   </GlassPaper>
//                 </Grid>
//                 <Grid item xs={12} md={4}>
//                   <GlassPaper>
//                     <SectionHeader title="Category Statistics" />
//                     <Box>
//                       <InfoRow label="Total Categories" value={stats.totalCategories} icon={<Category fontSize="small" />} />
//                       <InfoRow label="Active Categories" value={stats.activeCategories} icon={<CheckCircle fontSize="small" />} />
//                       <InfoRow label="Inactive Categories" value={stats.totalCategories - stats.activeCategories} icon={<Close fontSize="small" />} />
//                     </Box>
//                   </GlassPaper>
//                 </Grid>
//                 <Grid item xs={12} md={4}>
//                   <GlassPaper>
//                     <SectionHeader title="Recent Activity" />
//                     <Box>
//                       <InfoRow
//                         label="New Users (Last 30 days)"
//                         value={
//                           users.filter(u =>
//                             new Date(u.created_at) > new Date(new Date().setDate(new Date().getDate() - 30))
//                           ).length
//                         }
//                         icon={<PersonAdd fontSize="small" />}
//                       />
//                       <InfoRow
//                         label="Updated Categories (Last 30 days)"
//                         value={
//                           categories.filter(c =>
//                             new Date(c.updated_at) > new Date(new Date().setDate(new Date().getDate() - 30))
//                           ).length
//                         }
//                         icon={<Edit fontSize="small" />}
//                       />
//                     </Box>
//                   </GlassPaper>
//                 </Grid>
//               </Grid>

//               {/* Data Tables */}
//               <Grid container spacing={3}>
//                 <Grid item xs={12} md={6}>
//                   <GlassPaper>
//                     <SectionHeader 
//                       title="Recent Users" 
//                       action={
//                         <Box display="flex" gap={1}>
//                           <DatePicker
//                             selected={reportConfig.usersStartDate || reportConfig.startDate}
//                             onChange={(date) => setReportConfig({ ...reportConfig, usersStartDate: date })}
//                             selectsStart
//                             startDate={reportConfig.usersStartDate || reportConfig.startDate}
//                             endDate={reportConfig.usersEndDate || reportConfig.endDate}
//                             customInput={
//                               <TextField
//                                 size="small"
//                                 sx={{ width: '120px' }}
//                                 InputProps={{
//                                   startAdornment: (
//                                     <InputAdornment position="start">
//                                       <FilterAlt fontSize="small" />
//                                     </InputAdornment>
//                                   ),
//                                   sx: {
//                                     borderRadius: '10px'
//                                   }
//                                 }}
//                               />
//                             }
//                           />
//                           <DatePicker
//                             selected={reportConfig.usersEndDate || reportConfig.endDate}
//                             onChange={(date) => setReportConfig({ ...reportConfig, usersEndDate: date })}
//                             selectsEnd
//                             startDate={reportConfig.usersStartDate || reportConfig.startDate}
//                             endDate={reportConfig.usersEndDate || reportConfig.endDate}
//                             minDate={reportConfig.usersStartDate || reportConfig.startDate}
//                             customInput={
//                               <TextField
//                                 size="small"
//                                 sx={{ width: '120px' }}
//                                 InputProps={{
//                                   startAdornment: (
//                                     <InputAdornment position="start">
//                                       <FilterAlt fontSize="small" />
//                                     </InputAdornment>
//                                   ),
//                                   sx: {
//                                     borderRadius: '10px'
//                                   }
//                                 }}
//                               />
//                             }
//                           />
//                         </Box>
//                       }
//                     />
//                     <TableContainer>
//                       <Table size="small">
//                         <EnhancedTableHead headers={['Name', 'Status', 'Date']} />
//                         <TableBody>
//                           {users
//                             .filter(user => {
//                               const userDate = new Date(user.created_at);
//                               const startDate = reportConfig.usersStartDate || reportConfig.startDate;
//                               const endDate = reportConfig.usersEndDate || reportConfig.endDate;
//                               return userDate >= startDate && userDate <= endDate;
//                             })
//                             .slice(0, 5)
//                             .map(user => (
//                               <TableRow key={user.id} hover>
//                                 <TableCell>
//                                   <Typography variant="body2" fontWeight={500}>
//                                     {user.name}
//                                   </Typography>
//                                 </TableCell>
//                                 <TableCell>
//                                   <StatusBadge status={user.isApproved ? 'approved' : 'pending'} />
//                                 </TableCell>
//                                 <TableCell>
//                                   <Typography variant="body2">
//                                     {new Date(user.created_at).toLocaleDateString()}
//                                   </Typography>
//                                 </TableCell>
//                               </TableRow>
//                             ))}
//                         </TableBody>
//                       </Table>
//                     </TableContainer>
//                   </GlassPaper>
//                 </Grid>
//                 <Grid item xs={12} md={6}>
//                   <GlassPaper>
//                     <SectionHeader 
//                       title="Recent Categories" 
//                       action={
//                         <Box display="flex" gap={1}>
//                           <DatePicker
//                             selected={reportConfig.categoriesStartDate || reportConfig.startDate}
//                             onChange={(date) => setReportConfig({ ...reportConfig, categoriesStartDate: date })}
//                             selectsStart
//                             startDate={reportConfig.categoriesStartDate || reportConfig.startDate}
//                             endDate={reportConfig.categoriesEndDate || reportConfig.endDate}
//                             customInput={
//                               <TextField
//                                 size="small"
//                                 sx={{ width: '120px' }}
//                                 InputProps={{
//                                   startAdornment: (
//                                     <InputAdornment position="start">
//                                       <FilterAlt fontSize="small" />
//                                     </InputAdornment>
//                                   ),
//                                   sx: {
//                                     borderRadius: '10px'
//                                   }
//                                 }}
//                               />
//                             }
//                           />
//                           <DatePicker
//                             selected={reportConfig.categoriesEndDate || reportConfig.endDate}
//                             onChange={(date) => setReportConfig({ ...reportConfig, categoriesEndDate: date })}
//                             selectsEnd
//                             startDate={reportConfig.categoriesStartDate || reportConfig.startDate}
//                             endDate={reportConfig.categoriesEndDate || reportConfig.endDate}
//                             minDate={reportConfig.categoriesStartDate || reportConfig.startDate}
//                             customInput={
//                               <TextField
//                                 size="small"
//                                 sx={{ width: '120px' }}
//                                 InputProps={{
//                                   startAdornment: (
//                                     <InputAdornment position="start">
//                                       <FilterAlt fontSize="small" />
//                                     </InputAdornment>
//                                   ),
//                                   sx: {
//                                     borderRadius: '10px'
//                                   }
//                                 }}
//                               />
//                             }
//                           />
//                         </Box>
//                       }
//                     />
//                     <TableContainer>
//                       <Table size="small">
//                         <EnhancedTableHead headers={['Name', 'Rate', 'Status']} />
//                         <TableBody>
//                           {categories
//                             .filter(category => {
//                               const categoryDate = new Date(category.created_at);
//                               const startDate = reportConfig.categoriesStartDate || reportConfig.startDate;
//                               const endDate = reportConfig.categoriesEndDate || reportConfig.endDate;
//                               return categoryDate >= startDate && categoryDate <= endDate;
//                             })
//                             .slice(0, 5)
//                             .map(category => (
//                               <TableRow key={category.id} hover>
//                                 <TableCell>
//                                   <Typography variant="body2" fontWeight={500}>
//                                     {category.name}
//                                   </Typography>
//                                 </TableCell>
//                                 <TableCell>
//                                   <Typography variant="body2">
//                                     {category.tax_percentage}%
//                                   </Typography>
//                                 </TableCell>
//                                 <TableCell>
//                                   <StatusBadge status={category.is_active ? 'active' : 'inactive'} />
//                                 </TableCell>
//                               </TableRow>
//                             ))}
//                         </TableBody>
//                       </Table>
//                     </TableContainer>
//                   </GlassPaper>
//                 </Grid>
//               </Grid>
//             </GlassPaper>
//           </Box>
//         )}
//       </Container>

//       {/* PDF Generation Dialog */}
//       <Dialog 
//         open={pdfDialogOpen} 
//         onClose={() => setPdfDialogOpen(false)} 
//         maxWidth="md" 
//         fullWidth
//         PaperProps={{
//           sx: {
//             borderRadius: '16px',
//             background: theme.palette.background.paper
//           }
//         }}
//       >
//         <DialogTitle sx={{
//           background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
//           color: 'white',
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           py: 2,
//           borderTopLeftRadius: 'inherit',
//           borderTopRightRadius: 'inherit'
//         }}>
//           <Typography variant="h6" sx={{ fontWeight: 600 }}>
//             Generate PDF Report
//           </Typography>
//           <IconButton 
//             onClick={() => setPdfDialogOpen(false)} 
//             sx={{ 
//               color: 'white',
//               '&:hover': {
//                 backgroundColor: alpha(theme.palette.common.white, 0.1)
//               }
//             }}
//           >
//             <Close />
//           </IconButton>
//         </DialogTitle>
//         <DialogContent sx={{ p: 3 }}>
//           <Grid container spacing={3}>
//             <Grid item xs={12} md={6}>
//               <FormControl fullWidth margin="normal">
//                 <DatePicker
//                   selected={reportConfig.startDate}
//                   onChange={(date) => setReportConfig({ ...reportConfig, startDate: date })}
//                   customInput={<CustomDatePickerInput label="Start Date" />}
//                   selectsStart
//                   startDate={reportConfig.startDate}
//                   endDate={reportConfig.endDate}
//                 />
//               </FormControl>
//             </Grid>
//             <Grid item xs={12} md={6}>
//               <FormControl fullWidth margin="normal">
//                 <DatePicker
//                   selected={reportConfig.endDate}
//                   onChange={(date) => setReportConfig({ ...reportConfig, endDate: date })}
//                   customInput={<CustomDatePickerInput label="End Date" />}
//                   selectsEnd
//                   startDate={reportConfig.startDate}
//                   endDate={reportConfig.endDate}
//                   minDate={reportConfig.startDate}
//                 />
//               </FormControl>
//             </Grid>
//             <Grid item xs={12}>
//               <FormControl fullWidth margin="normal">
//                 <InputLabel>Report Type</InputLabel>
//                 <Select
//                   value={reportConfig.reportType}
//                   onChange={(e) => setReportConfig({ ...reportConfig, reportType: e.target.value })}
//                   label="Report Type"
//                   sx={{
//                     borderRadius: '10px'
//                   }}
//                 >
//                   <SelectMenuItem value="summary">Summary Report</SelectMenuItem>
//                   <SelectMenuItem value="detailed">Detailed Report</SelectMenuItem>
//                   <SelectMenuItem value="custom">Custom Report</SelectMenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={12}>
//               <FormControl fullWidth margin="normal">
//                 <InputLabel>Report Sections</InputLabel>
//                 <Select
//                   multiple
//                   value={Object.keys(pdfConfig).filter(key => pdfConfig[key])}
//                   onChange={(e) => {
//                     const newConfig = { ...pdfConfig };
//                     Object.keys(pdfConfig).forEach(key => {
//                       newConfig[key] = e.target.value.includes(key);
//                     });
//                     setPdfConfig(newConfig);
//                   }}
//                   renderValue={(selected) => selected.join(', ')}
//                   sx={{
//                     borderRadius: '10px'
//                   }}
//                 >
//                   <SelectMenuItem value="includeCharts">Include Charts</SelectMenuItem>
//                   <SelectMenuItem value="includeTables">Include Data Tables</SelectMenuItem>
//                   <SelectMenuItem value="includeUserDetails">Include User Details</SelectMenuItem>
//                   <SelectMenuItem value="includeCategoryDetails">Include Category Details</SelectMenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={12}>
//               <FormControl fullWidth margin="normal">
//                 <TextField
//                   label="Report Title"
//                   value={pdfConfig.title}
//                   onChange={(e) => setPdfConfig({ ...pdfConfig, title: e.target.value })}
//                   sx={{
//                     '& .MuiOutlinedInput-root': {
//                       borderRadius: '10px'
//                     }
//                   }}
//                 />
//               </FormControl>
//             </Grid>
//             <Grid item xs={12}>
//               <FormControl fullWidth margin="normal">
//                 <TextareaAutosize
//                   minRows={3}
//                   placeholder="Additional notes for the report..."
//                   style={{ 
//                     width: '100%', 
//                     padding: '12px',
//                     borderRadius: '10px',
//                     border: `1px solid ${theme.palette.divider}`,
//                     backgroundColor: theme.palette.background.paper,
//                     fontFamily: theme.typography.fontFamily,
//                     fontSize: '0.875rem'
//                   }}
//                 />
//               </FormControl>
//             </Grid>
//           </Grid>
//         </DialogContent>
//         <DialogActions sx={{ p: 3, pt: 0 }}>
//           <SecondaryButton onClick={() => setPdfDialogOpen(false)}>
//             Cancel
//           </SecondaryButton>
//           <PDFDownloadLink
//             document={
//               <PDFDocument
//                 data={generateReportData()}
//                 config={pdfConfig}
//                 reportConfig={reportConfig}
//               />
//             }
//             fileName="admin_report.pdf"
//           >
//             {({ loading }) => (
//               <PrimaryButton disabled={loading}>
//                 {loading ? 'Preparing document...' : 'Download PDF'}
//               </PrimaryButton>
//             )}
//           </PDFDownloadLink>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// };

// export default AdminDashboard;