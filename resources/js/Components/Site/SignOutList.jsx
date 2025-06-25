import React, { useState } from 'react';

// Example data; in a real app, fetch this from your backend
const mockSignedInUsers = [
  { id: 1, firstName: 'Alice', lastName: 'Smith' },
  { id: 2, firstName: 'Bob', lastName: 'Jones' },
  { id: 3, firstName: 'Charlie', lastName: 'Brown' },
];

export default function SignOutList({ onComplete }) {
  const [users, setUsers] = useState(mockSignedInUsers);
  const [signingOutId, setSigningOutId] = useState(null);

  const handleSignOut = (id) => {
    setSigningOutId(id);
    // Simulate sign out delay
    setTimeout(() => {
      setUsers(users.filter(user => user.id !== id));
      setSigningOutId(null);
      onComplete();
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white dark:bg-dark-900">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-8">
        Who is signing out?
      </h2>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {users.length === 0 && (
          <div className="text-lg text-gray-700 dark:text-dark-300">No one is currently signed in.</div>
        )}
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between bg-gray-100 dark:bg-dark-800 rounded px-4 py-3">
            <span className="text-lg text-gray-900 dark:text-dark-100">
              {user.firstName} {user.lastName.charAt(0)}.
            </span>
            <button
              className="ml-4 px-4 py-2 bg-theme-500 text-white rounded shadow hover:bg-theme-600 focus:outline-none"
              onClick={() => handleSignOut(user.id)}
              disabled={signingOutId === user.id}
            >
              {signingOutId === user.id ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}