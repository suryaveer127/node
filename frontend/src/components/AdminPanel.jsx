import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const AdminPanel = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const [allUsers, setAllUsers] = useState([]);
  const [liveUsers, setLiveUsers] = useState([]);
  const [popupUser, setPopupUser] = useState(null);
  const socketRef = useRef(null);

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
    <div className="userlist-container">
      <h2>Admin Panel - Users Status</h2>

      <table className="userlist-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Status</th><th>Socket ID</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.length === 0 ? (
            <tr><td colSpan="4" className="no-users">No users registered</td></tr>
          ) : allUsers.map(user => {
              const online = isUserLive(user.email);
              return (
                <tr key={user._id} onClick={() => handleUserClick(user)} className="user-row">
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td className={online ? 'status-online' : 'status-offline'}>
                    {online ? 'Online' : 'Offline'}
                  </td>
                  <td>{getSocketId(user.email)}</td>
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
            <p><b>Socket ID:</b> {popupUser.socketId}</p>
            <p><b>Created At:</b> {popupUser.creationTime ? new Date(popupUser.creationTime).toLocaleString() : ''}</p>
            <button className="popup-close-btn" onClick={closePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
