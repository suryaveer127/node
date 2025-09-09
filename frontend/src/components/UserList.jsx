


import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const UserList = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [liveUsers, setLiveUsers] = useState([]);
    const [popupUser, setPopupUser] = useState(null);
  const socketRef = useRef(null);

  // Load current user (from sessionStorage)
  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    if (storedUser && storedUser !== "undefined") {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem("currentUser");
      }
    }
  }, []);

  // Fetch initial users
  const fetchUsers = async () => {
    try {
      const res = await fetch("https://not-4adl.onrender.com/api/auth/users");
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

    const socket = io("https://not-4adl.onrender.com");
    socketRef.current = socket;

    socket.on("connect", () => {
  if (currentUser) {
   
    socket.emit("joinLive", {
      email: currentUser.email,
      name: `${currentUser.firstName} ${currentUser.lastName}`,
    });
  }
});

    socket.on("updateLiveUsers", (liveList) => {
      setLiveUsers(liveList || []);
    });

 
        socket.on("userRegistered", (newUser) => {
      setAllUsers((prev) => {
        const exists = prev.some((u) => u.email === newUser.email);
        if (!exists) return [...prev, newUser];
        return prev.map((u) => (u.email === newUser.email? { ...u, ...newUser } : u));
      });
    });

    socket.on("userLoggedIn", (user) => {
  setAllUsers((prev) => {
    const exists = prev.some((u) => u.email === user.email);
    if (!exists) return [...prev, user];
    return prev.map((u) => (u.email=== user.email? { ...u, ...user } : u));
  });

    setLiveUsers((prev) => {
        const exists = prev.some((u) => u.email=== user.email);
        if (!exists) return [...prev, user];
        return prev.map((u) => (u.email === user.email ? { ...u, ...user } : u));
      });
    });


    
    socket.on("userLoggedOut", (loggedOutUser) => {
      setLiveUsers((prev) => prev.filter((u) => u.email !== loggedOutUser.email));
    });

    return () => socket.disconnect();
  }, [currentUser]);

  const isUserLive = (email) =>
    liveUsers.some((u) => u.email === email);

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect(); 
    }
    sessionStorage.removeItem("currentUser");
    setCurrentUser(null);
  };
    const handleUserClick = user => {
    setPopupUser(user);
  };
  const closePopup = () => setPopupUser(null);

  if (!currentUser) return <div>User logged out</div>;
 const getUserName = (user) => {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User";
};

  return (
        <div className="userlist-container">
      <h2 className="userlist-title">User List</h2>
      <button onClick={handleLogout}>Logout</button>

      <table className="userlist-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.map((user) => (
<tr key={user.email} onClick={() => handleUserClick(user)} className="user-row">
              <td>{getUserName(user)}</td>
              <td>{user.email}</td>
              <td className={online ? 'status-online' : 'status-offline'}>{isUserLive(user.email) ? "Online" : "Offline"}</td>
            </tr>
          ))}
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
            <button className="popup-close-btn" onClick={closePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
