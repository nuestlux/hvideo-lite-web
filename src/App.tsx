/**
 * Main Application Component
 * User Management System with enhanced features
 */

import React from 'react';
import UserManagementTable from './components/UserManagementTable';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Quản lý tài khoản</h1>
        <p className="subtitle">Hệ thống quản lý người dùng với tính năng đặt lại mật khẩu</p>
      </header>

      <main className="app-main">
        <section className="section">
          <h2 className="section-title">Danh sách người dùng</h2>
          <UserManagementTable />
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 Hvideo Lite. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
