import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const UserList = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [liveUsers, setLiveUsers] = useState([]);
  const [popupUser, setPopupUser] = useState(null);
  const socketRef = useRef(null);

  // Load current user
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser && storedUser !== 'undefined') {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Fetch initial users
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

  // Socket connection
  useEffect(() => {
    if (!currentUser) return;

    const socket = io('https://not-4adl.onrender.com');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinLive', currentUser);
    });

    // Live status
    socket.on('updateLiveUsers', (liveList) => {
      setLiveUsers(liveList || []);
    });

    // New registration
    socket.on('userRegistered', (newUser) => {
      setAllUsers(prev => {
        if (!prev.some(u => u._id === newUser._id)) return [...prev, newUser];
        return prev;
      });
    });

    // User logged in
    socket.on('userLoggedIn', (user) => {
      setLiveUsers(prev => {
        if (!prev.some(u => u.email === user.email)) return [...prev, user];
        return prev;
      });
      setAllUsers(prev => {
        if (!prev.some(u => u.email === user.email)) return [...prev, user];
        return prev;
      });
    });

    // User logged out
   socket.on('userLoggedOut', (loggedOutUser) => {
  setLiveUsers(prev => prev.filter(u => u._id !== loggedOutUser._id));
});
 socket.on('userLoggedOut', (loggedOutUser) => {
      setLiveUsers((prev) => prev.filter((u) => u._id !== loggedOutUser._id));
    });


    return () => socket.disconnect();
  }, [currentUser]);

  const isUserLive = email =>
    liveUsers.some(u => u.email === email);

  const handleLogout = () => {
  if (socketRef.current) {
    socketRef.current.disconnect(); // disconnect only this tab
  }
  localStorage.removeItem('currentUser');
  setCurrentUser(null);
};

  if (!currentUser) return <div>User logged out</div>;

  return (
    <div>
      <h2>User List</h2>
      <button onClick={handleLogout}>Logout</button>

      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Status</th></tr>
        </thead>
        <tbody>
          {allUsers.map(user => (
            <tr key={user._id}>
              <td>{user.name || `${user.firstName} ${user.lastName}`}</td>
              <td>{user.email}</td>
              <td>{isUserLive(user.email) ? 'Online' : 'Offline'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;


