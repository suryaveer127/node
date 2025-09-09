import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const UserList = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [liveUsers, setLiveUsers] = useState([]);
  const [popupUser, setPopupUser] = useState(null);
  const socketRef = useRef(null);

  // Load current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser && storedUser !== 'undefined') {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse currentUser from localStorage:', e);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Fetch initial users list
  const fetchUsers = async () => {
    try {
      const res = await fetch('https://not-4adl.onrender.com/api/auth/users');
      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Setup socket connection
  useEffect(() => {
    if (!currentUser) return;

    const socket = io('https://not-4adl.onrender.com');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('joinLive', {
        email: currentUser.email,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
      });
    });

    // Update live users list
    socket.on('updateLiveUsers', (liveList) => {
      setLiveUsers(liveList || []);
    });

    // Add new registered user to list
    socket.on('userRegistered', (newUser) => {
      setAllUsers(prev => {
        if (prev.some(u => u._id === newUser._id)) return prev;
        return [...prev, newUser];
      });
    });

    // Optional: handle user updates
    socket.on('userUpdated', (updatedUser) => {
      setAllUsers(prev =>
        prev.map(u => (u._id === updatedUser._id ? updatedUser : u))
      );
    });

    // Cleanup on page unload
    const handleBeforeUnload = () => {
      if (socketRef.current && currentUser) {
        socketRef.current.emit('logoutUser', { email: currentUser.email });
        socketRef.current.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser]);

  // Helpers
  const emailMatch = (a, b) =>
    (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

  const isUserLive = email =>
    liveUsers.some(lu => lu && emailMatch(lu.email, email));

  const handleUserClick = user => setPopupUser(user);
  const closePopup = () => setPopupUser(null);

  const handleLogout = () => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit('logoutUser', { email: currentUser.email });
      socketRef.current.disconnect();
    }
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <div>User is logged out. Please login again.</div>;
  }

  return (
    <div className="userlist-container">
      <h2>User List</h2>
      <button onClick={handleLogout}>Logout</button>

      <table className="userlist-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.length === 0 ? (
            <tr>
              <td colSpan="3">No users registered</td>
            </tr>
          ) : allUsers.map(user => {
              const online = isUserLive(user.email);
              return (
                <tr key={user._id} onClick={() => handleUserClick(user)}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td className={online ? 'status-online' : 'status-offline'}>
                    {online ? 'Online' : 'Offline'}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {popupUser && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <h3>User Info</h3>
            <p><b>Name:</b> {popupUser.firstName} {popupUser.lastName}</p>
            <p><b>Email:</b> {popupUser.email}</p>
            <p><b>Mobile:</b> {popupUser.mobile}</p>
            <p><b>Address:</b> {popupUser.address?.street}, {popupUser.address?.city}, {popupUser.address?.state}, {popupUser.address?.country}</p>
            <p><b>Login ID:</b> {popupUser.loginId}</p>
            <p><b>Created At:</b> {popupUser.creationTime ? new Date(popupUser.creationTime).toLocaleString() : ''}</p>
            <button onClick={closePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
