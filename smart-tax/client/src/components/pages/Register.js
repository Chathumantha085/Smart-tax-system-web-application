import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Paper,
  Link,
} from '@mui/material';
import Swal from 'sweetalert2';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    contact_number: '',
    gender: '',
    nationality: '',
    id_number: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Passwords do not match!',
      });
      return;
    }

    try {
      const { confirmPassword, ...payload } = formData;

      const response = await api.post('/api/auth/register', payload);

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Registration successful!',
      }).then(() => {
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          address: '',
          contact_number: '',
          gender: '',
          nationality: '',
          id_number: '',
        });

        navigate('/');
      });

      console.log('Registration Response:', response.data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Registration failed. Please try again.',
      });
      console.error('Registration Error:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      }}
    >
      {/* Left Side Visual */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
          color: 'white',
          p: 4,
        }}
      >
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to the Smart Tax System
          </Typography>
          <Typography variant="h6">
            Join us and simplify your tax management with our modern, secure, and efficient Smart Tax System.
          </Typography>
        </Box>

      </Box>

      {/* Right Side Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#ffffff',
          p: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: '500px' }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            User Registration
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Contact Number"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <MenuItem value="">Select Gender</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Nationality"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="ID Number"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              required
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
                '&:hover': {
                  background: 'linear-gradient(135deg, #2575fc 0%, #6a11cb 100%)',
                },
              }}
            >
              Register
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Have an account?{' '}
                <Link href="/" variant="body2" sx={{ color: '#2575fc', fontWeight: 'bold' }}>
                  Login
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Register;
