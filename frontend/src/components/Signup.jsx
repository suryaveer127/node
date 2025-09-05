import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    street: '',
    city: '',
    state: '',
    country: '',
    loginId: '',
    password: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpMobile, setOtpMobile] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState(false);
  const [verifiedMobile, setVerifiedMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Simple validation (expand as needed)
  const validate = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Invalid email';
    if (!/^\d{10}$/.test(formData.mobile)) return 'Mobile must be 10 digits';
    if (!formData.street.trim()) return 'Street is required';
    if (!formData.city.trim()) return 'City is required';
    if (!formData.state.trim()) return 'State is required';
    if (!formData.country.trim()) return 'Country is required';
    if (!formData.loginId.match(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8}$/)) return 'Login ID must be 8 chars with letters and digits';
    if (!formData.password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/)) return 'Password must include uppercase, lowercase, special char, min 6';
    return '';
  };

  const resetOtpAndVerification = () => {
    setOtpSent(false);
    setOtpEmail('');
    setOtpMobile('');
    setVerifiedEmail(false);
    setVerifiedMobile(false);
  };

  // Step 1: Save temporary user in Redis
  const saveTempUser = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/register-temp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        return true;
      } else {
        setError(data.error || 'Failed to save temporary user');
        return false;
      }
    } catch {
      setError('Server error saving temporary user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send OTPs to email and mobile after saving temp user
  const sendOtp = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const saved = await saveTempUser();
    if (!saved) return;

    setLoading(true);
    setError('');
    try {
      const [emailRes, mobileRes] = await Promise.all([
        fetch(`${apiBaseUrl}/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact: formData.email, type: 'email' }),
        }),
        fetch(`${apiBaseUrl}/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact: formData.mobile, type: 'mobile' }),
        }),
      ]);
      if (emailRes.ok && mobileRes.ok) {
        setOtpSent(true);
      } else {
        setError('Failed to send OTPs');
      }
    } catch {
      setError('Server error sending OTPs');
    } finally {
      setLoading(false);
    }
  };

 
  const verifyOtp = async (type) => {
    setLoading(true);
    setError('');
    const otpValue = type === 'email' ? otpEmail : otpMobile;
    try {
      const response = await fetch(`${apiBaseUrl}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: type === 'email' ? formData.email : formData.mobile, otp: otpValue, type }),
      });
      const data = await response.json();
      if (response.ok) {
        type === 'email' ? setVerifiedEmail(true) : setVerifiedMobile(true);
      } else {
        if (data.error && data.error.toLowerCase().includes('temporary user data')) {
          setError('Your session expired or temporary data missing. Please restart registration.');
          resetOtpAndVerification();
        } else {
          setError(data.error || `Failed to verify ${type} OTP`);
        }
      }
    } catch {
      setError('Server error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

const finalizeRegistration = async () => {
  if (!verifiedEmail || !verifiedMobile) {
    setError('Please verify both email and mobile OTPs');
    return;
  }
  setLoading(true);
  setError('');
  try {
    const response = await fetch(`${apiBaseUrl}/auth/register-final`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email }),
    });
    const data = await response.json();
    if (response.ok) {
      alert('Registration successful');
      navigate('/login');
    } else {
      if (data.error && (data.error.toLowerCase().includes('exists') || data.error.toLowerCase().includes('duplicate'))) {
        alert('User with this email/mobile/login ID already exists. Please use different credentials or login.');
      } else if (data.error && data.error.toLowerCase().includes('temporary user data')) {
        setError('Your session expired or temporary data missing. Please restart registration.');
        resetOtpAndVerification();
      } else {
        setError(data.error || 'Registration failed');
      }
    }
  } catch {
    setError('Server error during finalization');
  } finally {
    setLoading(false);
  }
};

  const bothVerified = verifiedEmail && verifiedMobile;

  return (
    <div class="form-container">
      <h2>Sign Up</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

     
      <input className='form-input' name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} disabled={otpSent} />
      <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} disabled={otpSent} />

    
      <input className='form-input' name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} disabled={otpSent} />
      <input name="mobile" placeholder="Mobile" value={formData.mobile} onChange={handleChange} disabled={otpSent} />

    
      <input className='form-input'  name="street" placeholder="Street" value={formData.street} onChange={handleChange} disabled={otpSent} />
      <input className='form-input' name="city" placeholder="City" value={formData.city} onChange={handleChange} disabled={otpSent} />
      <input className='form-input' name="state" placeholder="State" value={formData.state} onChange={handleChange} disabled={otpSent} />
      <input className='form-input' name="country" placeholder="Country" value={formData.country} onChange={handleChange} disabled={otpSent} />

   
      <input name="loginId" placeholder="Login ID" value={formData.loginId} onChange={handleChange} disabled={otpSent} />
      <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} disabled={otpSent} />

      {!otpSent ? (
        <button onClick={sendOtp} disabled={loading}>
          {loading ? 'Sending OTPs...' : 'Send OTPs'}
        </button>
      ) : (
        <div>
          <div>
            <input
              placeholder="Email OTP"
              value={otpEmail}
              onChange={(e) => setOtpEmail(e.target.value)}
              disabled={verifiedEmail || loading}
            />
            <button onClick={() => verifyOtp('email')} disabled={verifiedEmail || loading || !otpEmail.trim()}>
              {verifiedEmail ? 'Verified' : 'Verify Email OTP'}
            </button>
          </div>
          <div>
            <input
              placeholder="Mobile OTP"
              value={otpMobile}
              onChange={(e) => setOtpMobile(e.target.value)}
              disabled={verifiedMobile || loading}
            />
            <button onClick={() => verifyOtp('mobile')} disabled={verifiedMobile || loading || !otpMobile.trim()}>
              {verifiedMobile ? 'Verified' : 'Verify Mobile OTP'}
            </button>
          </div>

          {bothVerified && (
            <button onClick={finalizeRegistration} disabled={loading}>
              {loading ? 'Registering...' : 'Final Registration'}
            </button>
          )}
          
        </div>
      )}
      <div className="form-footer">
       
        <a className="form-link" href="/login">Login</a>
      </div>
      <div>
        <a className=''href="/admin">Admin</a>
      </div>
    </div>
  );
};

export default Signup;
