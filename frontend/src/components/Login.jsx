// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const Login = () => {
//   const navigate = useNavigate();
 

//   const [formData, setFormData] = useState({ email: '', password: '' });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

//   const validate = () => {
//     if (!formData.email.trim()) return 'Login ID is required';
//     if (!formData.password.trim()) return 'Password is required';
//     return '';
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const validationError = validate();
//     if (validationError) {
//       setError(validationError);
//       return;
//     }

//     setLoading(true);
//     setError('');
//    console.log('Sending login data:', formData);
//     try {
//       const response = await fetch(`https://not-4adl.onrender.com/api/auth/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });
//       const data = await response.json();

//       if (response.ok) {
       
// localStorage.setItem('currentUser', JSON.stringify(data));

//         // Navigate to UserList page passing userId without socket
//         navigate('/users');
//       } else {
//         setError(data.error || 'Login failed');
//       }
//     } catch {
//       setError('Server error during login');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="form-container">
//       <h2 className="form-title">Login</h2>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <form onSubmit={handleSubmit} autoComplete="off">
//         <input
//           className="form-input"
//           name="email"
//           placeholder="email"
//           value={formData.email}
//           onChange={handleChange}
//           disabled={loading}
//         />
//         <input
//           className="form-input"
//           type="password"
//           name="password"
//           placeholder="Password"
//           value={formData.password}
//           onChange={handleChange}
//           disabled={loading}
//         />
//         <button className="form-button" type="submit" disabled={loading}>
//           {loading ? 'Logging in...' : 'Login'}
//         </button>
//       </form>
//       <div className="form-footer">
//         Don't have an account? <a className="form-link" href="/signup">Register</a>
//       </div>
//     </div>
//   );
// };

// export default Login;



import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validate = () => {
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.password.trim()) return 'Password is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://not-4adl.onrender.com/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        const newUser = { email: formData.email, token: data.token, userInfo: data };

        // Get stored users or empty array
        let storedUsers = JSON.parse(localStorage.getItem('multiUsers') || '[]');

        // Remove existing user by email if any, then add updated user
        storedUsers = storedUsers.filter(u => u.email !== formData.email);
        storedUsers.push(newUser);
        localStorage.setItem('multiUsers', JSON.stringify(storedUsers));

        // Set active user email in localStorage
        localStorage.setItem('activeUserEmail', formData.email);

        // Broadcast login to other tabs for real-time sync
        localStorage.setItem('newUserRegistered', JSON.stringify(newUser));
        localStorage.removeItem('newUserRegistered');

        navigate('/users');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Server error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} autoComplete="off">
        <input
          className="form-input"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
        />
        <input
          className="form-input"
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
        />
        <button className="form-button" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="form-footer">
        Don't have an account? <a className="form-link" href="/signup">Register</a>
      </div>
    </div>
  );
};

export default Login;
