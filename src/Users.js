import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

function ConfirmationPopup({ show, onCancel, onConfirm }) {
  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
        }}
      >
        <p>Are you sure you want to send an alert message to the user?</p>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            style={{
              backgroundColor: '#dc1259',
              color: 'white',
              borderRadius: '5px',
              padding: '5px 10px',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '10px', 
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{
              backgroundColor: '#dc1259',
              color: 'white',
              borderRadius: '5px',
              padding: '5px 10px',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '10px', 
            }}
            onClick={onConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}


function Users({ db }) {
  const [users, setUsers] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userIdToSendMessage, setUserIdToSendMessage] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [db]);

  const handleSendMessage = (userId) => {
    setUserIdToSendMessage(userId);
    setShowConfirmation(true);
  };

  const handleConfirmSendMessage = async () => {
    const message = "You have been possibly exposed to a COVID-positive user.";
    setShowConfirmation(false);
    setUserIdToSendMessage('');

    try {
      const userRef = doc(db, 'users', userIdToSendMessage);
      const notificationRef = doc(userRef, 'notifications', Date.now().toString());

      await setDoc(notificationRef, {
        message: message,
        timestamp: serverTimestamp(),
        isRead: false,
      });

      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCancelSendMessage = () => {
    setShowConfirmation(false);
    setUserIdToSendMessage('');
  };

  return (
    <div>
      <h2 className="pageTitle">Users</h2>
      <p style={{ margin: '0' }}>{users.length} users found</p>
      <table className="custom-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Date Created</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.dateCreated || 'July 10, 2023'}</td>
              <td>
                <button
                  style={{
                    backgroundColor: '#991232',
                    color: 'white',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSendMessage(user.id)}
                >
                  Message
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmationPopup
        show={showConfirmation}
        onCancel={handleCancelSendMessage}
        onConfirm={handleConfirmSendMessage}
      />
    </div>
  );
}

export default Users;
