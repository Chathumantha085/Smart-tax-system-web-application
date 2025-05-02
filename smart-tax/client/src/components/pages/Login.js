import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Swal from 'sweetalert2';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
} from '@mui/material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/api/auth/login', { email, password });

      const { token, user, message } = response.data;

      // Save token and user data to local storage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: message || 'You have successfully logged in!',
      });

      // Redirect based on role
      switch (user.role) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'user':
        default:
          navigate('/user-dashboard');
          break;
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || 'An error occurred. Please try again.',
      });
      console.error('Login Error:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        background: '#f5f5f5',
      }}
    >
      {/* Left Section: Branding */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
          color: 'white',
          p: 4,
          borderRadius: '0 20px 20px 0',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: '600px' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Welcome to the Smart Tax System
          </Typography>
          <Typography variant="h5" sx={{ lineHeight: 1.6, mb: 4 }}>
            Join us and simplify your tax management with our modern, secure, and efficient Smart Tax System.
          </Typography>
          <Button
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              px: 5,
              py: 1.5,
              fontSize: '1.1rem',
            }}
          >
            Learn More
          </Button>
        </Box>
      </Box>

      {/* Right Section: Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: '400px',
            borderRadius: '10px',
            background: 'white',
          }}
        >
          <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
            Login
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #2575fc 0%, #6a11cb 100%)' },
              }}
            >
              Login
            </Button>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link href="/register" variant="body2" sx={{ color: '#2575fc', fontWeight: 'bold' }}>
                Register
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
