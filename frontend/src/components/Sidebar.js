import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();

    const navItems = [
        {
            group: 'GENERAL', items: [
                { label: 'Dashboard', icon: '📊', path: '/dashboard' },
                { label: 'Interviews', icon: '🎯', path: '/interviews' },
                { label: 'My Bookings', icon: '📅', path: '/my-bookings' },
            ]
        },
        {
            group: 'ACCOUNT', items: [
                { label: 'Profile', icon: '👤', path: '/profile' },
                { label: 'Settings', icon: '⚙️', path: '#' },
            ]
        }
    ];

    if (user?.role === 'admin') {
        navItems.push({
            group: 'ADMIN', items: [
                { label: 'Console', icon: '👑', path: '/admin' }
            ]
        });
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">HFY</div>
                <div className="brand-info">
                    <span className="name">InterviewHub</span>
                    <span className="plan">Business Plan</span>
                </div>
                <div className="brand-toggle">↕️</div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((group, idx) => (
                    <div key={idx} className="nav-group">
                        <h4 className="group-title">{group.group}</h4>
                        {group.items.map((item, i) => (
                            <NavLink
                                key={i}
                                to={item.path}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <span className="icon">{item.icon}</span>
                                <span className="label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-mini-card">
                    <div className="mini-avatar">
                        {user?.name?.charAt(0)}
                    </div>
                    <div className="mini-info">
                        <div className="mini-name">{user?.name}</div>
                        <div className="mini-role">{user?.role}</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
