import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { GlassCard, GradientButton, HoverIconButton } from '../../styles.js';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Modal,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Chip,
    Grid,
    Checkbox,
    FormControlLabel,
    Avatar,
    LinearProgress,
    Badge
} from '@mui/material';
import {
    Menu as MenuIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    AttachFile as AttachFileIcon,
    Dashboard as DashboardIcon,
    Receipt as ReceiptIcon,
    Category as CategoryIcon,
    AccountBalanceWallet as WalletIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    CalendarToday as CalendarIcon,
    Repeat as RepeatIcon,
    CreditCard as CreditCardIcon,
    Notifications as NotificationsIcon,
    AccountCircle as AccountCircleIcon,
    TrendingUp as TrendingUpIcon,
    MonetizationOn as MonetizationOnIcon,
    Autorenew as AutorenewIcon,
    FilePresent as FilePresentIcon,
    FiberManualRecord as FiberManualRecordIcon,
    PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled, alpha } from '@mui/material/styles';

// Custom styled components
const FuturisticAppBar = styled(AppBar)(({ theme }) => ({
    background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`
}));

// const GlassCard = styled(Card)(({ theme }) => ({
//     background: alpha(theme.palette.background.paper, 0.8),
//     backdropFilter: 'blur(10px)',
//     borderRadius: '12px',
//     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
//     border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
//     transition: 'transform 0.3s, box-shadow 0.3s',
//     '&:hover': {
//         transform: 'translateY(-5px)',
//         boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
//     }
// }));

// const HoverIconButton = styled(IconButton)(({ theme }) => ({
//     transition: 'all 0.3s',
//     '&:hover': {
//         transform: 'scale(1.1)',
//         color: theme.palette.primary.main
//     }
// }));

// const GradientButton = styled(Button)(({ theme }) => ({
//     background: 'linear-gradient(45deg, #3f51b5 0%, #2196f3 100%)',
//     color: 'white',
//     fontWeight: 'bold',
//     borderRadius: '8px',
//     padding: '8px 16px',
//     textTransform: 'none',
//     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//     '&:hover': {
//         boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
//         background: 'linear-gradient(45deg, #3949ab 0%, #1e88e5 100%)'
//     }
// }));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: alpha(theme.palette.primary.main, 0.05)
    },
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1)
    }
}));

const BACKEND_BASE_URL = "http://localhost:5000/";



const UserDashboard = () => {
    const [taxCategories, setTaxCategories] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [userDetails, setUserDetails] = useState(null);
    const [openDrawer, setOpenDrawer] = useState(true);
    const [openExpenseModal, setOpenExpenseModal] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        dateFrom: null,
        dateTo: null,
        amountMin: '',
        amountMax: ''
    });
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        date: new Date(),
        category: '',
        expenseType: 'one-time',
        receipt: null,
        isRecurring: false,
        recurringDay: 1,
        setupAutoPay: false,
        cardDetails: {
            number: '',
            expiry: '',
            cvv: ''
        }
    });

    const navigate = useNavigate();

    const fetchUserDetails = async () => {
        try {
            const response = await api.get('/api/auth/me');
            setUserDetails(response.data);
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            setLoadingPaymentMethods(true);
            // Mock API call - replace with your actual API endpoint
            const response = await api.get('/api/payment-methods');
            setPaymentMethods(response.data);
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        } finally {
            setLoadingPaymentMethods(false);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expensesRes, categoriesRes] = await Promise.all([
                api.get('/api/expenses'),
                api.get('/api/tax-categories')
            ]);

            setExpenses(expensesRes.data);
            setFilteredExpenses(expensesRes.data);
            const categoriesArray = Object.values(categoriesRes.data);
            const activeCats = categoriesArray.filter(cat => cat.is_active === 1);
            setTaxCategories(activeCats);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        const requestInterceptor = api.interceptors.request.use(
            config => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            error => {
                return Promise.reject(error);
            }
        );

        const responseInterceptor = api.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/');
                }
                return Promise.reject(error);
            }
        );

        fetchData();
        fetchUserDetails();
        fetchPaymentMethods();

        return () => {
            api.interceptors.request.eject(requestInterceptor);
            api.interceptors.response.eject(responseInterceptor);
        };
    }, [navigate]);

    const fetchExpenses = async () => {
        try {
            const response = await api.get('/api/expenses');
            setExpenses(response.data);
            setFilteredExpenses(response.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    };

    const applyFilters = () => {
        let result = [...expenses];

        if (filters.category) {
            result = result.filter(expense => expense.category_id == filters.category);
        }

        if (filters.dateFrom) {
            result = result.filter(expense => new Date(expense.date) >= new Date(filters.dateFrom));
        }

        if (filters.dateTo) {
            result = result.filter(expense => new Date(expense.date) <= new Date(filters.dateTo));
        }

        if (filters.amountMin) {
            result = result.filter(expense => Number(expense.amount) >= Number(filters.amountMin));
        }

        if (filters.amountMax) {
            result = result.filter(expense => Number(expense.amount) <= Number(filters.amountMax));
        }

        setFilteredExpenses(result);
    };

    const resetFilters = () => {
        setFilters({
            category: '',
            dateFrom: null,
            dateTo: null,
            amountMin: '',
            amountMax: ''
        });
        setFilteredExpenses(expenses);
    };

    const generateReport = () => {
        // Import jsPDF and autoTable dynamically to avoid SSR issues
        import('jspdf').then(({ default: jsPDF }) => {
            import('jspdf-autotable').then((autoTable) => {
                const doc = new jsPDF();

                // Add report title
                doc.setFontSize(18);
                doc.text('Expense Report', 105, 15, { align: 'center' });

                // Add user details
                doc.setFontSize(12);
                if (userDetails) {
                    doc.text(`Name: ${userDetails.name}`, 14, 25);
                    doc.text(`Email: ${userDetails.email}`, 14, 35);
                    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 45);
                }

                // Add filter criteria
                doc.setFontSize(14);
                doc.text('Filter Criteria', 14, 60);
                doc.setFontSize(10);

                let filterText = 'All expenses';
                if (
                    filters.category || filters.dateFrom || filters.dateTo ||
                    filters.amountMin || filters.amountMax
                ) {
                    filterText = 'Filtered by: ';
                    const filtersApplied = [];

                    if (filters.category) {
                        const category = taxCategories.find(cat => cat.id == filters.category);
                        filtersApplied.push(`Category: ${category?.name || filters.category}`);
                    }

                    if (filters.dateFrom) {
                        filtersApplied.push(`From: ${format(new Date(filters.dateFrom), 'MMM dd, yyyy')}`);
                    }

                    if (filters.dateTo) {
                        filtersApplied.push(`To: ${format(new Date(filters.dateTo), 'MMM dd, yyyy')}`);
                    }

                    if (filters.amountMin) {
                        filtersApplied.push(`Min Amount: $${filters.amountMin}`);
                    }

                    if (filters.amountMax) {
                        filtersApplied.push(`Max Amount: $${filters.amountMax}`);
                    }

                    filterText += filtersApplied.join(', ');
                }

                doc.text(filterText, 14, 70);

                // Add expenses table
                autoTable.default(doc, {
                    startY: 80,
                    head: [['Date', 'Description', 'Category', 'Amount', 'Tax', 'Type']],
                    body: filteredExpenses.map(expense => [
                        format(new Date(expense.date), 'MMM dd, yyyy'),
                        expense.description,
                        expense.category_name,
                        `$${Number(expense.amount).toFixed(2)}`,
                        `$${(Number(expense.amount) * (Number(expense.tax_percentage) / 100)).toFixed(2)}`,
                        expense.expense_type === 'recurring'
                            ? `Recurring (Day ${expense.recurring_day})`
                            : expense.expense_type
                    ]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: [63, 81, 181],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: {
                        fillColor: [240, 240, 240]
                    }
                });

                // Add summary
                const totalAmount = filteredExpenses.reduce(
                    (sum, expense) => sum + Number(expense.amount), 0
                );

                const totalTax = filteredExpenses.reduce(
                    (sum, expense) => sum + (Number(expense.amount) * (Number(expense.tax_percentage) / 100)), 0
                );

                const finalY = doc.lastAutoTable.finalY || 100;

                doc.setFontSize(14);
                doc.text('Summary', 14, finalY + 15);
                doc.setFontSize(12);
                doc.text(`Total Expenses: $${totalAmount.toFixed(2)}`, 14, finalY + 25);
                doc.text(`Total Tax Deductible: $${totalTax.toFixed(2)}`, 14, finalY + 35);
                doc.text(`Number of Expenses: ${filteredExpenses.length}`, 14, finalY + 45);

                // Save the PDF
                doc.save(`Expense_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
            });
        }).catch(error => {
            console.error('Error generating PDF:', error);
        });
    };


    const handleAddExpense = async () => {
        try {
            const formData = new FormData();
            Object.keys(newExpense).forEach(key => {
                if (key !== 'receipt' && key !== 'cardDetails') {
                    formData.append(key, newExpense[key]);
                }
            });

            if (newExpense.receipt) {
                formData.append('receipt', newExpense.receipt);
            }

            if (newExpense.setupAutoPay) {
                formData.append('cardDetails', JSON.stringify(newExpense.cardDetails));
            }

            await api.post('/api/expenses', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setOpenExpenseModal(false);
            setNewExpense({
                description: '',
                amount: '',
                date: new Date(),
                category: '',
                expenseType: 'one-time',
                receipt: null,
                isRecurring: false,
                recurringDay: 1,
                setupAutoPay: false,
                cardDetails: {
                    number: '',
                    expiry: '',
                    cvv: ''
                }
            });
            fetchExpenses();
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handleEditExpense = () => {
        if (!selectedExpense) return;

        setNewExpense({
            description: selectedExpense.description,
            amount: selectedExpense.amount,
            date: new Date(selectedExpense.date),
            category: selectedExpense.category_id,
            expenseType: selectedExpense.expense_type,
            receipt: null,
            isRecurring: selectedExpense.expense_type === 'recurring',
            recurringDay: selectedExpense.recurring_day || 1,
            setupAutoPay: false,
            cardDetails: {
                number: '',
                expiry: '',
                cvv: ''
            }
        });
        setOpenExpenseModal(true);
    };

    const handleUpdateExpense = async () => {
        try {
            const formData = new FormData();
            Object.keys(newExpense).forEach(key => {
                if (key !== 'receipt' && key !== 'cardDetails') {
                    formData.append(key, newExpense[key]);
                }
            });

            if (newExpense.receipt) {
                formData.append('receipt', newExpense.receipt);
            }

            if (newExpense.setupAutoPay) {
                formData.append('cardDetails', JSON.stringify(newExpense.cardDetails));
            }

            await api.put(`/api/expenses/${selectedExpense.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setOpenExpenseModal(false);
            setSelectedExpense(null);
            setNewExpense({
                description: '',
                amount: '',
                date: new Date(),
                category: '',
                expenseType: 'one-time',
                receipt: null,
                isRecurring: false,
                recurringDay: 1,
                setupAutoPay: false,
                cardDetails: {
                    number: '',
                    expiry: '',
                    cvv: ''
                }
            });
            fetchExpenses();
        } catch (error) {
            console.error('Error updating expense:', error);
        }
    };

    const handleDeleteExpense = async () => {
        try {
            await api.delete(`/api/expenses/${selectedExpense.id}`);
            setOpenDeleteDialog(false);
            setSelectedExpense(null);
            fetchExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const handleFileChange = (e) => {
        setNewExpense({ ...newExpense, receipt: e.target.files[0] });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    // Calculate summary data
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const taxDeductible = filteredExpenses.reduce((sum, expense) => {
        const amount = Number(expense.amount) || 0;
        const taxPercentage = expense.tax_percentage || 0;
        return sum + (amount * (taxPercentage / 100));
    }, 0);
    const recurringPayments = filteredExpenses.filter(e => e.expense_type === 'recurring').length;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)' }}>
                {/* App Bar */}
                <FuturisticAppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={() => setOpenDrawer(!openDrawer)}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <MonetizationOnIcon sx={{ mr: 1 }} />
                            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                                SmartTax Pro
                            </Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1 }} />
                        <IconButton color="inherit">
                            <Badge badgeContent={4} color="secondary">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                        <IconButton color="inherit" sx={{ ml: 1 }}>
                            <AccountCircleIcon />
                        </IconButton>
                    </Toolbar>
                </FuturisticAppBar>

                {/* Sidebar Drawer */}
                <Drawer
                    variant="persistent"
                    open={openDrawer}
                    sx={{
                        width: 280,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: 280,
                            boxSizing: 'border-box',
                            marginTop: '64px',
                            background: 'linear-gradient(180deg, #1a237e 0%, #283593 100%)',
                            color: 'white',
                            borderRight: 'none'
                        }
                    }}
                >
                    <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <Avatar sx={{ width: 64, height: 64, margin: '0 auto 10px', bgcolor: '#3949ab' }}>
                            <AccountCircleIcon fontSize="large" />
                        </Avatar>
                        <Typography variant="h6">{userDetails?.name || 'Loading...'}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {userDetails?.email || ''}
                        </Typography>
                    </Box>
                    <List>
                        <ListItem button selected sx={{
                            borderRadius: '8px',
                            margin: '4px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.15)'
                            }
                        }}>
                            <ListItemIcon sx={{ color: 'white' }}>
                                <DashboardIcon />
                            </ListItemIcon>
                            <ListItemText primary="Dashboard" />
                        </ListItem>
                        <ListItem button sx={{
                            borderRadius: '8px',
                            margin: '4px 8px',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.15)'
                            }
                        }}>
                            {/* <ListItemIcon sx={{ color: 'white' }}>
                                <ReceiptIcon />
                            </ListItemIcon>
                            <ListItemText primary="Expenses" />
                        </ListItem>
                        <ListItem button sx={{
                            borderRadius: '8px',
                            margin: '4px 8px',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.15)'
                            }
                        }}>
                            <ListItemIcon sx={{ color: 'white' }}>
                                <CategoryIcon />
                            </ListItemIcon>
                            <ListItemText primary="Categories" />
                        </ListItem>
                        <ListItem button sx={{
                            borderRadius: '8px',
                            margin: '4px 8px',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.15)'
                            }
                        }}>
                            <ListItemIcon sx={{ color: 'white' }}>
                                <WalletIcon />
                            </ListItemIcon> */}
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

                            <ListItem
                                button
                                onClick={() => navigate('/payment-methods')}
                                sx={{
                                    borderRadius: '8px',
                                    margin: '4px 8px',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)'
                                    }
                                }}>
                                <ListItemIcon sx={{ color: 'white' }}>
                                    <WalletIcon />
                                </ListItemIcon>
                                <ListItemText primary="Payment Methods" />
                            </ListItem>
                        </ListItem>
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                        {/* <ListItem button sx={{
                            borderRadius: '8px',
                            margin: '4px 8px',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.15)'
                            }
                        }}>
                            <ListItemIcon sx={{ color: 'white' }}>
                                <SettingsIcon />
                            </ListItemIcon>
                            <ListItemText primary="Settings" />
                        </ListItem> */}
                        <ListItem button onClick={handleLogout} sx={{
                            borderRadius: '8px',
                            margin: '4px 8px',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.15)'
                            }
                        }}>
                            <ListItemIcon sx={{ color: 'white' }}>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                    </List>
                </Drawer>

                {/* Main Content */}
                <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}>
                    {loading && <LinearProgress color="primary" />}

                    <Grid container spacing={3}>
                        {/* Summary Cards */}
                        <Grid item xs={12} md={4}>
                            <GlassCard>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <Avatar sx={{ bgcolor: '#3f51b5', mr: 2 }}>
                                            <TrendingUpIcon />
                                        </Avatar>
                                        <Typography variant="h6" color="textSecondary">
                                            Total Expenses
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        ${totalExpenses.toFixed(2)}
                                    </Typography>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        This Month
                                    </Typography>
                                    <Box mt={2}>
                                        <LinearProgress variant="determinate" value={75} color="primary" sx={{ height: 8, borderRadius: 4 }} />
                                    </Box>
                                </CardContent>
                            </GlassCard>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <GlassCard>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                                            <MonetizationOnIcon />
                                        </Avatar>
                                        <Typography variant="h6" color="textSecondary">
                                            Tax Deductible
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        ${taxDeductible.toFixed(2)}
                                    </Typography>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Potential Savings
                                    </Typography>
                                    <Box mt={2}>
                                        <LinearProgress variant="determinate" value={45} color="success" sx={{ height: 8, borderRadius: 4 }} />
                                    </Box>
                                </CardContent>
                            </GlassCard>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <GlassCard>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <Avatar sx={{ bgcolor: '#9c27b0', mr: 2 }}>
                                            <AutorenewIcon />
                                        </Avatar>
                                        <Typography variant="h6" color="textSecondary">
                                            Recurring Payments
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {recurringPayments}
                                    </Typography>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Active Subscriptions
                                    </Typography>
                                    <Box mt={2}>
                                        <LinearProgress variant="determinate" value={recurringPayments * 20} color="secondary" sx={{ height: 8, borderRadius: 4 }} />
                                    </Box>
                                </CardContent>
                            </GlassCard>
                        </Grid>

                        {/* Filters and Actions */}
                        <Grid item xs={12}>
                            <GlassCard>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <FiberManualRecordIcon color="primary" sx={{ fontSize: 14, mr: 1 }} />
                                        Filter Expenses
                                    </Typography>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} sm={6} md={3}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Category</InputLabel>
                                                <Select
                                                    value={filters.category}
                                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                                    label="Category"
                                                    sx={{ background: 'rgba(255, 255, 255, 0.9)' }}
                                                >
                                                    <MenuItem value="">All Categories</MenuItem>
                                                    {taxCategories.map((category) => (
                                                        <MenuItem key={category.id} value={category.id}>
                                                            {category.name} ({category.tax_percentage}%)
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2}>
                                            <DatePicker
                                                label="From Date"
                                                value={filters.dateFrom}
                                                onChange={(date) => setFilters({ ...filters, dateFrom: date })}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        fullWidth
                                                        size="small"
                                                        sx={{ background: 'rgba(255, 255, 255, 0.9)' }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2}>
                                            <DatePicker
                                                label="To Date"
                                                value={filters.dateTo}
                                                onChange={(date) => setFilters({ ...filters, dateTo: date })}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        fullWidth
                                                        size="small"
                                                        sx={{ background: 'rgba(255, 255, 255, 0.9)' }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2}>
                                            <TextField
                                                label="Min Amount"
                                                type="number"
                                                value={filters.amountMin}
                                                onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                                                fullWidth
                                                size="small"
                                                sx={{ background: 'rgba(255, 255, 255, 0.9)' }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2}>
                                            <TextField
                                                label="Max Amount"
                                                type="number"
                                                value={filters.amountMax}
                                                onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                                                fullWidth
                                                size="small"
                                                sx={{ background: 'rgba(255, 255, 255, 0.9)' }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={1}>
                                            <GradientButton
                                                fullWidth
                                                onClick={applyFilters}
                                            >
                                                Apply
                                            </GradientButton>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={1}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                onClick={resetFilters}
                                                sx={{ borderRadius: '8px' }}
                                            >
                                                Reset
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={1}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="secondary"
                                                startIcon={<PdfIcon />}
                                                onClick={generateReport}
                                                sx={{ borderRadius: '8px' }}
                                            >
                                                Report
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </GlassCard>
                        </Grid>

                        {/* Add Expense Button */}
                        <Grid item xs={12}>
                            <GradientButton
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setSelectedExpense(null);
                                    setOpenExpenseModal(true);
                                }}
                            >
                                Add New Expense
                            </GradientButton>
                        </Grid>

                        {/* Expenses Table */}
                        <Grid item xs={12}>
                            <GlassCard>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <FiberManualRecordIcon color="primary" sx={{ fontSize: 14, mr: 1 }} />
                                        <Typography variant="h6">Recent Expenses</Typography>
                                    </Box>
                                    <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                                        <Table>
                                            <TableHead sx={{ background: 'linear-gradient(45deg, #3f51b5 0%, #2196f3 100%)' }}>
                                                <TableRow>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tax</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Receipt</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredExpenses.map((expense) => {
                                                    const amount = Number(expense.amount) || 0;
                                                    const taxPercentage = expense.tax_percentage || 0;
                                                    const taxAmount = amount * (taxPercentage / 100);

                                                    return (
                                                        <StyledTableRow key={expense.id}>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center">
                                                                    <CalendarIcon color="action" sx={{ mr: 1, fontSize: 18 }} />
                                                                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>{expense.description}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={expense.category_name}
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                    sx={{ borderRadius: '6px' }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>${amount.toFixed(2)}</TableCell>
                                                            <TableCell>${taxAmount.toFixed(2)}</TableCell>
                                                            <TableCell>
                                                                {expense.expense_type === 'recurring' ? (
                                                                    <Box display="flex" alignItems="center">
                                                                        <RepeatIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                                        <span>Day {expense.recurring_day}</span>
                                                                    </Box>
                                                                ) : (
                                                                    expense.expense_type
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {expense.receipt_path ? (
                                                                    <HoverIconButton
                                                                        size="small"
                                                                        onClick={() => window.open(`${BACKEND_BASE_URL}${expense.receipt_path}`, '_blank')}
                                                                    >
                                                                        <FilePresentIcon color="primary" />
                                                                    </HoverIconButton>
                                                                ) : (
                                                                    <Typography variant="caption" color="textSecondary">
                                                                        None
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <HoverIconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                        setSelectedExpense(expense);
                                                                        handleEditExpense();
                                                                    }}
                                                                >
                                                                    <EditIcon color="primary" />
                                                                </HoverIconButton>
                                                                <HoverIconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                        setSelectedExpense(expense);
                                                                        setOpenDeleteDialog(true);
                                                                    }}
                                                                >
                                                                    <DeleteIcon color="error" />
                                                                </HoverIconButton>
                                                            </TableCell>
                                                        </StyledTableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </GlassCard>
                        </Grid>
                    </Grid>
                </Box>

                {/* Add/Edit Expense Modal */}
                <Modal
                    open={openExpenseModal}
                    onClose={() => {
                        setOpenExpenseModal(false);
                        setSelectedExpense(null);
                    }}
                    aria-labelledby="expense-modal"
                >
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: '90%', sm: 600 },
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 3,
                        border: 'none',
                        outline: 'none'
                    }}>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center' }}>
                            {selectedExpense ? (
                                <>
                                    <EditIcon color="primary" sx={{ mr: 1 }} />
                                    Edit Expense
                                </>
                            ) : (
                                <>
                                    <AddIcon color="primary" sx={{ mr: 1 }} />
                                    Add New Expense
                                </>
                            )}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    fullWidth
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Amount"
                                    type="number"
                                    fullWidth
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="Date"
                                    value={newExpense.date}
                                    onChange={(date) => setNewExpense({ ...newExpense, date })}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={newExpense.category}
                                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                        label="Category"
                                        variant="outlined"
                                    >
                                        <MenuItem value="">Select Category</MenuItem>
                                        {taxCategories.map((category) => (
                                            <MenuItem key={category.id} value={category.id}>
                                                {category.name} ({category.tax_percentage}%)
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Expense Type</InputLabel>
                                    <Select
                                        value={newExpense.expenseType}
                                        onChange={(e) => setNewExpense({
                                            ...newExpense,
                                            expenseType: e.target.value,
                                            isRecurring: e.target.value === 'recurring'
                                        })}
                                        label="Expense Type"
                                        variant="outlined"
                                    >
                                        <MenuItem value="one-time">One Time</MenuItem>
                                        <MenuItem value="recurring">Recurring</MenuItem>
                                        <MenuItem value="future">Future Payment</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {newExpense.expenseType === 'recurring' && (
                                <Grid item xs={12}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Recurring Day</InputLabel>
                                        <Select
                                            value={newExpense.recurringDay}
                                            onChange={(e) => setNewExpense({ ...newExpense, recurringDay: e.target.value })}
                                            label="Recurring Day"
                                            variant="outlined"
                                        >
                                            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                                <MenuItem key={day} value={day}>Day {day} of month</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}

                            {(newExpense.expenseType === 'recurring' || newExpense.expenseType === 'future') && (
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={newExpense.setupAutoPay}
                                                onChange={(e) => setNewExpense({ ...newExpense, setupAutoPay: e.target.checked })}
                                                color="primary"
                                            />
                                        }
                                        label="Set up automatic payment for this expense"
                                    />
                                </Grid>
                            )}

                            {newExpense.setupAutoPay && (
                                <>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                            <CreditCardIcon color="primary" sx={{ mr: 1 }} />
                                            Payment Method
                                        </Typography>
                                    </Grid>

                                    {paymentMethods.length > 0 ? (
                                        <>
                                            <Grid item xs={12}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Select Payment Method</InputLabel>
                                                    <Select
                                                        value={newExpense.selectedPaymentMethod || ''}
                                                        onChange={(e) => setNewExpense({
                                                            ...newExpense,
                                                            selectedPaymentMethod: e.target.value
                                                        })}
                                                        label="Select Payment Method"
                                                        variant="outlined"
                                                    >
                                                        {paymentMethods.map(method => (
                                                            <MenuItem key={method.id} value={method.id}>
                                                                {method.nickname || `${method.cardType} Card`} (•••• {method.masked_number})
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Button
                                                    variant="text"
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => navigate('/payment-methods')}
                                                >
                                                    Add new payment method
                                                </Button>
                                            </Grid>
                                        </>
                                    ) : (
                                        <Grid item xs={12}>
                                            <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    You don't have any payment methods saved.
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => navigate('/payment-methods')}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Add Payment Method
                                                </Button>
                                            </Card>
                                        </Grid>
                                    )}
                                </>
                            )}

                            <Grid item xs={12}>
                                <Button
                                    variant="outlined"
                                    startIcon={<AttachFileIcon />}
                                    component="label"
                                    sx={{ borderRadius: '8px' }}
                                >
                                    Upload Receipt
                                    <input
                                        type="file"
                                        hidden
                                        onChange={handleFileChange}
                                    />
                                </Button>
                                {newExpense.receipt && (
                                    <Typography variant="caption" sx={{ ml: 2 }}>
                                        {newExpense.receipt.name || "No file selected"}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <GradientButton
                                    onClick={selectedExpense ? handleUpdateExpense : handleAddExpense}
                                    fullWidth
                                    size="large"
                                >
                                    {selectedExpense ? 'Update Expense' : 'Save Expense'}
                                </GradientButton>
                            </Grid>
                        </Grid>
                    </Box>
                </Modal>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={openDeleteDialog}
                    onClose={() => setOpenDeleteDialog(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: '12px',
                            padding: '16px'
                        }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete this expense: "{selectedExpense?.description}"?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setOpenDeleteDialog(false)}
                            variant="outlined"
                            sx={{ borderRadius: '8px' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteExpense}
                            color="error"
                            variant="contained"
                            sx={{ borderRadius: '8px' }}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default UserDashboard;