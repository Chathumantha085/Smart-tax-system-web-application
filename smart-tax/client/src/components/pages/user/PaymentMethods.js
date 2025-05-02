import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { format, differenceInMonths, parse } from 'date-fns';
import { GlassCard, GradientButton, HoverIconButton } from '../../styles.js';
import {
    Box,
    Typography,
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
    TextField,
    Grid,
    MenuItem,
    Chip,
    Avatar,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox,
    Snackbar,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CreditCard as CreditCardIcon,
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Star as StarIcon,
    ShowChart as ShowChartIcon,
    AccountBalanceWallet as WalletIcon,
    Payment as PaymentIcon,
    Security as SecurityIcon,
    CreditScore as CreditScoreIcon
} from '@mui/icons-material';

const PaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [stats, setStats] = useState({
        totalCards: 0,
        expiringSoon: 0,
        defaultSet: false,
        cardTypes: {}
    });
    const [openModal, setOpenModal] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [loading, setLoading] = useState({
        methods: true,
        action: false
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [newPaymentMethod, setNewPaymentMethod] = useState({
        nickname: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardType: 'visa',
        is_default: false
    });

    const navigate = useNavigate();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    const fetchPaymentMethods = async () => {
        try {
            setLoading(prev => ({ ...prev, methods: true }));
            const response = await api.get('/api/payment-methods', getAuthHeaders());
            setPaymentMethods(response.data);
            calculateStats(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching payment methods:', err);
            setError(err.response?.data?.message || 'Failed to load payment methods');
        } finally {
            setLoading(prev => ({ ...prev, methods: false }));
        }
    };

    const calculateStats = (methods) => {
        const now = new Date();
        let expiringSoon = 0;
        const cardTypes = {};
        
        methods.forEach(method => {
            // Calculate expiring cards
            const [month, year] = method.expiry_date.split('/');
            const expiryDate = parse(`20${year}-${month}-01`, 'yyyy-MM-dd', new Date());
            if (differenceInMonths(expiryDate, now) <= 3) {
                expiringSoon++;
            }
            
            // Count card types
            cardTypes[method.card_type] = (cardTypes[method.card_type] || 0) + 1;
        });

        setStats({
            totalCards: methods.length,
            expiringSoon,
            defaultSet: methods.some(m => m.is_default),
            cardTypes
        });
    };

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const handleAddPaymentMethod = async () => {
        try {
            setLoading(prev => ({ ...prev, action: true }));
            setError(null);
            
            const [expiryMonth, expiryYear] = newPaymentMethod.expiryDate.split('/');
            const payload = {
                ...newPaymentMethod,
                expiryMonth,
                expiryYear: `20${expiryYear}`,
                cardNumber: newPaymentMethod.cardNumber,
                cvv: newPaymentMethod.cvv
            };

            await api.post(
                '/api/payment-methods',
                payload,
                getAuthHeaders()
            );

            setOpenModal(false);
            setNewPaymentMethod({
                nickname: '',
                cardNumber: '',
                expiryDate: '',
                cvv: '',
                cardType: 'visa',
                is_default: false
            });
            
            setSuccess('Payment method added successfully');
            await fetchPaymentMethods();
        } catch (error) {
            console.error('Error adding payment method:', error);
            setError(error.response?.data?.message || 'Failed to add payment method');
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    const handleUpdatePaymentMethod = async () => {
        if (!selectedMethod) return;

        try {
            setLoading(prev => ({ ...prev, action: true }));
            setError(null);
            
            const [expiryMonth, expiryYear] = newPaymentMethod.expiryDate.split('/');
            const payload = {
                nickname: newPaymentMethod.nickname,
                cardType: newPaymentMethod.cardType,
                is_default: newPaymentMethod.is_default,
                expiryMonth,
                expiryYear: `20${expiryYear}`
            };

            await api.put(
                `/api/payment-methods/${selectedMethod.id}`,
                payload,
                getAuthHeaders()
            );

            setOpenModal(false);
            setSelectedMethod(null);
            setNewPaymentMethod({
                nickname: '',
                cardNumber: '',
                expiryDate: '',
                cvv: '',
                cardType: 'visa',
                is_default: false
            });
            
            setSuccess('Payment method updated successfully');
            await fetchPaymentMethods();
        } catch (error) {
            console.error('Error updating payment method:', error);
            setError(error.response?.data?.message || 'Failed to update payment method');
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    const handleDeletePaymentMethod = async () => {
        if (!selectedMethod) return;

        try {
            setLoading(prev => ({ ...prev, action: true }));
            setError(null);
            
            await api.delete(
                `/api/payment-methods/${selectedMethod.id}`,
                getAuthHeaders()
            );

            setOpenDeleteDialog(false);
            setSelectedMethod(null);
            
            setSuccess('Payment method deleted successfully');
            await fetchPaymentMethods();
        } catch (error) {
            console.error('Error deleting payment method:', error);
            setError(error.response?.data?.message || 'Failed to delete payment method');
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    const handleSetDefault = async (methodId) => {
        try {
            setLoading(prev => ({ ...prev, action: true }));
            setError(null);
            
            await api.patch(
                `/api/payment-methods/${methodId}/set-default`,
                {},
                getAuthHeaders()
            );
            
            setSuccess('Default payment method updated successfully');
            await fetchPaymentMethods();
        } catch (error) {
            console.error('Error setting default payment method:', error);
            setError(error.response?.data?.message || 'Failed to set default payment method');
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    const formatCardNumber = (number) => {
        if (!number) return '•••• •••• •••• ••••';
        return '•••• •••• •••• ' + number.slice(-4);
    };

    const getCardIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'visa': return '/icons/visa.png';
            case 'mastercard': return '/icons/mastercard.png';
            case 'amex': return '/icons/amex.png';
            case 'discover': return '/icons/discover.png';
            default: return '/icons/credit-card.png';
        }
    };

    const handleExpiryDateChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        setNewPaymentMethod({ ...newPaymentMethod, expiryDate: value });
    };

    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        setNewPaymentMethod({ ...newPaymentMethod, cardNumber: value });
    };

    const handleCvvChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setNewPaymentMethod({ ...newPaymentMethod, cvv: value });
    };

    const getCardTypeDistribution = () => {
        return Object.entries(stats.cardTypes).map(([type, count]) => ({
            type,
            count,
            percentage: Math.round((count / stats.totalCards) * 100)
        }));
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Notifications */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>
            
            <Snackbar
                open={!!success}
                autoHideDuration={4000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Payment Methods
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <GradientButton
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setSelectedMethod(null);
                        setNewPaymentMethod({
                            nickname: '',
                            cardNumber: '',
                            expiryDate: '',
                            cvv: '',
                            cardType: 'visa',
                            is_default: false
                        });
                        setOpenModal(true);
                    }}
                    disabled={loading.action}
                >
                    Add New Payment Method
                </GradientButton>
            </Box>

            {loading.methods && <LinearProgress />}

            <Grid container spacing={3}>
                {/* Payment Methods */}
                <Grid item xs={12} md={8}>
                    <GlassCard>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                                Your Payment Methods
                            </Typography>
                            
                            {paymentMethods.length === 0 && !loading.methods ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <CreditCardIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="body1" color="text.secondary">
                                        No payment methods found. Add one to get started.
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                                    <Table>
                                        <TableHead sx={{ background: 'linear-gradient(45deg, #3f51b5 0%, #2196f3 100%)' }}>
                                            <TableRow>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Card</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Number</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Expires</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paymentMethods.map((method) => (
                                                <TableRow key={method.id} hover>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Avatar 
                                                                src={getCardIcon(method.card_type)} 
                                                                sx={{ width: 40, height: 25, mr: 2 }}
                                                                variant="square"
                                                            />
                                                            {method.nickname || `${method.card_type} Card`}
                                                            {method.is_default && (
                                                                <Chip 
                                                                    label="Default" 
                                                                    size="small" 
                                                                    color="primary" 
                                                                    sx={{ ml: 2 }} 
                                                                    icon={<StarIcon fontSize="small" />}
                                                                />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{formatCardNumber(method.masked_number)}</TableCell>
                                                    <TableCell>
                                                        {method.expiry_date}
                                                    </TableCell>
                                                    <TableCell>
                                                        {method.status === 'active' ? (
                                                            <Chip 
                                                                icon={<CheckCircleIcon fontSize="small" />} 
                                                                label="Active" 
                                                                color="success" 
                                                                size="small" 
                                                            />
                                                        ) : (
                                                            <Chip 
                                                                icon={<CancelIcon fontSize="small" />} 
                                                                label="Expired" 
                                                                color="error" 
                                                                size="small" 
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <HoverIconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setSelectedMethod(method);
                                                                    setNewPaymentMethod({
                                                                        nickname: method.nickname,
                                                                        cardNumber: '',
                                                                        expiryDate: `${method.expiry_month}/${method.expiry_year?.slice(-2)}`,
                                                                        cvv: '',
                                                                        cardType: method.cardType,
                                                                        is_default: method.is_default
                                                                    });
                                                                    setOpenModal(true);
                                                                }}
                                                                disabled={loading.action}
                                                            >
                                                                {/* <EditIcon color="primary" /> */}
                                                            </HoverIconButton>
                                                            <HoverIconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setSelectedMethod(method);
                                                                    setOpenDeleteDialog(true);
                                                                }}
                                                                disabled={loading.action}
                                                            >
                                                                <DeleteIcon color="error" />
                                                            </HoverIconButton>
                                                            {!method.is_default && (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={() => handleSetDefault(method.id)}
                                                                    disabled={loading.action}
                                                                    startIcon={<StarIcon />}
                                                                    sx={{ ml: 1 }}
                                                                >
                                                                    Set Default
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </GlassCard>
                </Grid>

                {/* Payment Analytics Dashboard */}
                <Grid item xs={12} md={4}>
                    <GlassCard>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                                Payment Insights
                            </Typography>
                            
                            <Grid container spacing={2}>
                                {/* Total Cards */}
                                <Grid item xs={12}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        p: 2,
                                        boxShadow: '0 8px 16px rgba(106, 17, 203, 0.3)'
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <CreditScoreIcon sx={{ mr: 1 }} />
                                                <Typography variant="subtitle2">TOTAL CARDS</Typography>
                                            </Box>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {stats.totalCards}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                Payment methods saved
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                
                                {/* Expiring Soon */}
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        p: 2,
                                        boxShadow: '0 8px 16px rgba(241, 39, 17, 0.3)'
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <PaymentIcon sx={{ mr: 1 }} />
                                                <Typography variant="subtitle2">EXPIRING SOON</Typography>
                                            </Box>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {stats.expiringSoon}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                Within 3 months
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                
                                {/* Default Status */}
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        p: 2,
                                        boxShadow: '0 8px 16px rgba(17, 153, 142, 0.3)'
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <StarIcon sx={{ mr: 1 }} />
                                                <Typography variant="subtitle2">DEFAULT SET</Typography>
                                            </Box>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {stats.defaultSet ? 'Yes' : 'No'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                Primary payment method
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                
                                {/* Card Type Distribution */}
                                <Grid item xs={12}>
                                    <Card sx={{ 
                                        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        p: 2
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <ShowChartIcon sx={{ mr: 1 }} />
                                                <Typography variant="subtitle2">CARD TYPES</Typography>
                                            </Box>
                                            <Box sx={{ mt: 2 }}>
                                                {getCardTypeDistribution().map((cardType) => (
                                                    <Box key={cardType.type} sx={{ mb: 1 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                                {cardType.type}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {cardType.count} ({cardType.percentage}%)
                                                            </Typography>
                                                        </Box>
                                                        <LinearProgress 
                                                            variant="determinate" 
                                                            value={cardType.percentage} 
                                                            sx={{ 
                                                                height: 8,
                                                                borderRadius: 4,
                                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                                '& .MuiLinearProgress-bar': {
                                                                    borderRadius: 4,
                                                                    backgroundColor: '#fff'
                                                                }
                                                            }} 
                                                        />
                                                    </Box>
                                                ))}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Add/Edit Payment Method Modal */}
            <Modal
                open={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setSelectedMethod(null);
                }}
                aria-labelledby="payment-method-modal"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '90%', sm: 500 },
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 3,
                    border: 'none',
                    outline: 'none'
                }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center' }}>
                        <CreditCardIcon color="primary" sx={{ mr: 1 }} />
                        {selectedMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Card Nickname (Optional)"
                                fullWidth
                                value={newPaymentMethod.nickname}
                                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, nickname: e.target.value })}
                                variant="outlined"
                                size="small"
                                placeholder="e.g. My Business Card"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Card Number"
                                fullWidth
                                value={newPaymentMethod.cardNumber}
                                onChange={handleCardNumberChange}
                                variant="outlined"
                                size="small"
                                placeholder="1234 5678 9012 3456"
                                inputProps={{ maxLength: 19 }}
                                disabled={!!selectedMethod}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Expiry Date (MM/YY)"
                                fullWidth
                                value={newPaymentMethod.expiryDate}
                                onChange={handleExpiryDateChange}
                                variant="outlined"
                                size="small"
                                placeholder="MM/YY"
                                inputProps={{ maxLength: 5 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="CVV"
                                fullWidth
                                value={newPaymentMethod.cvv}
                                onChange={handleCvvChange}
                                variant="outlined"
                                size="small"
                                placeholder="123"
                                inputProps={{ maxLength: 4 }}
                                type="password"
                                disabled={!!selectedMethod}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select
                                label="Card Type"
                                fullWidth
                                value={newPaymentMethod.cardType}
                                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, cardType: e.target.value })}
                                variant="outlined"
                                size="small"
                                disabled={!!selectedMethod}
                            >
                                <MenuItem value="visa">Visa</MenuItem>
                                <MenuItem value="mastercard">Mastercard</MenuItem>
                                <MenuItem value="amex">American Express</MenuItem>
                                <MenuItem value="discover">Discover</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={newPaymentMethod.is_default}
                                        onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, is_default: e.target.checked })}
                                        color="primary"
                                    />
                                }
                                label="Set as default payment method"
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <GradientButton
                                onClick={selectedMethod ? handleUpdatePaymentMethod : handleAddPaymentMethod}
                                fullWidth
                                size="large"
                                disabled={loading.action}
                            >
                                {loading.action ? 'Processing...' : 
                                 (selectedMethod ? 'Update Payment Method' : 'Add Payment Method')}
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
                        Are you sure you want to delete this payment method: {selectedMethod?.nickname || `${selectedMethod?.cardType} Card`}?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenDeleteDialog(false)}
                        variant="outlined"
                        sx={{ borderRadius: '8px' }}
                        disabled={loading.action}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeletePaymentMethod}
                        color="error"
                        variant="contained"
                        sx={{ borderRadius: '8px' }}
                        disabled={loading.action}
                        startIcon={loading.action ? <CircularProgress size={20} /> : <DeleteIcon />}
                    >
                        {loading.action ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PaymentMethods;