// frontend/src/components/Header.jsx
// Top navigation bar for FileFlix

function Header({ currentView = "Dashboard" }) {
  return (
    <header className="top-header">
      <div className="header-breadcrumb">
        <span className="icon-bolt" style={{ color: "var(--accent-purple)" }}>📁</span>
        <span>{currentView}</span>
      </div>

      <div className="header-right-actions">
        {/* Help icon */}
        <button className="header-icon-btn" title="Help & Documentation">
          <span>?</span>
        </button>

        {/* Notification bell */}
        <button className="header-icon-btn" title="Notifications">
          <span>🔔</span>
          <span className="notification-dot"></span>
        </button>

        {/* User profile pill */}
        <div className="header-user-profile" title="Account settings">
          <div className="user-avatar">SM</div>
          <span className="user-name">Sowmiya M</span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>▼</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
