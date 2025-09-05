import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const AdminPanel = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const [allUsers, setAllUsers] = useState([]);
  const [liveUsers, setLiveUsers] = useState([]);
  const [popupUser, setPopupUser] = useState(null);
  const socketRef = useRef(null);

  // Fetch all users on mount
  useEffect(() => {
    fetch(`${apiBaseUrl}/auth/users`)
      .then(res => res.json())
      .then(data => {
        setAllUsers(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, [apiBaseUrl]);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Admin socket connected:', socket.id);
      socket.emit('joinAdmin');
    });

    socket.on('updateLiveUsers', (liveList) => {
      if (Array.isArray(liveList)) {
        setLiveUsers(liveList.filter(u => u && typeof u.email === 'string'));
      } else {
        setLiveUsers([]);
      }
    });

    socket.on('userLogout', (userEmail) => {
      setLiveUsers(prev => prev.filter(u => u.email !== userEmail));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emailMatch = (a, b) =>
    (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

  const isUserLive = (email) =>
    liveUsers.some(lu => lu && emailMatch(lu.email, email));

  const getSocketId = (email) => {
    const lu = liveUsers.find(lu => lu && emailMatch(lu.email, email));
    return lu ? lu.socketId : 'N/A';
  };

  const handleUserClick = (user) => {
    setPopupUser({
      ...user,
      socketId: getSocketId(user.email),
    });
  };

  const closePopup = () => setPopupUser(null);

  return (
    <div
      className="userlist-container"
      style={{ maxWidth: 700, margin: '30px auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}
    >
      <h2>Admin Panel - Users Status</h2>

      <table
        className="userlist-table"
        border="1"
        cellPadding="5"
        cellSpacing="0"
        style={{ width: '100%', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Status</th><th>Socket ID</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.length === 0 ? (
            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No users registered</td></tr>
          ) : allUsers.map(user => {
              const online = isUserLive(user.email);
              return (
                <tr key={user._id} onClick={() => handleUserClick(user)} style={{ cursor: 'pointer' }}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td style={{ color: online ? 'green' : 'red', fontWeight: 'bold' }}>
                    {online ? 'Online' : 'Offline'}
                  </td>
                  <td>{getSocketId(user.email)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {popupUser && (
        <div
          onClick={closePopup}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', padding: 20, borderRadius: 12, maxWidth: 400, width: '90%' }}
          >
            <h3>User Info</h3>
            <p><b>Name:</b> {popupUser.firstName} {popupUser.lastName}</p>
            <p><b>Email:</b> {popupUser.email}</p>
            <p><b>Mobile:</b> {popupUser.mobile}</p>
            <p><b>Address:</b> {popupUser.address?.street}, {popupUser.address?.city}, {popupUser.address?.state}, {popupUser.address?.country}</p>
            <p><b>Login ID:</b> {popupUser.loginId}</p>
            <p><b>Socket ID:</b> {popupUser.socketId}</p>
            <p><b>Created At:</b> {popupUser.creationTime ? new Date(popupUser.creationTime).toLocaleString() : ''}</p>
            <button style={{ marginTop: 12, padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }} onClick={closePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
