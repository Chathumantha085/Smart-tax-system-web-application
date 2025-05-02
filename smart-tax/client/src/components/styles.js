import { styled, alpha } from '@mui/material/styles';
import { Button, IconButton, Card } from '@mui/material';

export const GlassCard = styled(Card)(({ theme }) => ({
    background: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
    }
}));

export const GradientButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(45deg, #3f51b5 0%, #2196f3 100%)',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: '8px',
    padding: '8px 16px',
    textTransform: 'none',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    '&:hover': {
        boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
        background: 'linear-gradient(45deg, #3949ab 0%, #1e88e5 100%)'
    }
}));

export const HoverIconButton = styled(IconButton)(({ theme }) => ({
    transition: 'all 0.3s',
    '&:hover': {
        transform: 'scale(1.1)',
        color: theme.palette.primary.main
    }
}));