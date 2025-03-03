import React from 'react';
import { Link } from 'react-router-dom';

const DriverLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex">
      <aside className="w-64 bg-gray-800 text-white h-screen">
        <div className="p-4">
          <h2 className="text-lg font-bold">Driver Dashboard</h2>
        </div>
        <nav className="mt-4">
          <ul>
            <li>
              <Link to="/driver/home" className="block p-2 hover:bg-gray-700">
                Home
              </Link>
            </li>
            <li>
              <Link to="/driver/orders" className="block p-2 hover:bg-gray-700">
                My Orders
              </Link>
            </li>
            <li>
              <Link to="/driver/profile" className="block p-2 hover:bg-gray-700">
                Profile
              </Link>
            </li>
            <li>
              <Link to="/driver/settings" className="block p-2 hover:bg-gray-700">
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
};

export default DriverLayout;
