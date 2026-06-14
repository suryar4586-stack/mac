# ⊞ StackOS — Browser-Based Operating System

A full-stack, Windows 11-inspired web operating system built with **React** (frontend) and **Node.js + Express** (backend), featuring real window management, a virtual file system, live notifications via Socket.io, JWT authentication, and 10+ built-in apps.

---

## 🚀 Quick Start (3 commands)

```bash
# 1. Install all dependencies
npm run install:all

# 2. Copy env file and edit if needed
cp backend/.env.example backend/.env

# 3. Start both servers together
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## 📁 Project Structure

```
stackos/
├── package.json              ← root (concurrently scripts)
│
├── backend/
│   ├── server.js             ← Express + Socket.io entry
│   ├── .env.example          ← copy to .env
│   ├── models/
│   │   └── db.js             ← SQLite schema & helpers
│   ├── middleware/
│   │   ├── auth.js           ← JWT middleware
│   │   └── upload.js         ← Multer file uploads
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── fileController.js
│   │   ├── notesController.js
│   │   ├── terminalController.js
│   │   ├── settingsController.js
│   │   ├── appsController.js
│   │   ├── systemController.js
│   │   ├── notifController.js
│   │   └── browserController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── files.js
│   │   ├── notes.js
│   │   ├── terminal.js
│   │   ├── settings.js
│   │   ├── apps.js
│   │   ├── system.js
│   │   ├── notifications.js
│   │   └── browser.js
│   ├── sockets/
│   │   └── socketHandler.js  ← real-time events
│   └── storage/
│       ├── stackos.db        ← auto-created SQLite DB
│       └── uploads/          ← user uploaded files
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx
        ├── context/
        │   └── OSContext.jsx  ← global OS state
        ├── pages/
        │   ├── Desktop.jsx
        │   └── LoginPage.jsx
        ├── components/
        │   ├── Wallpaper.jsx
        │   ├── DesktopIcons.jsx
        │   ├── Taskbar.jsx
        │   ├── StartMenu.jsx
        │   ├── WindowManager.jsx
        │   ├── NotificationPanel.jsx
        │   ├── CalendarPopup.jsx
        │   ├── ContextMenu.jsx
        │   └── BootScreen.jsx
        ├── apps/
        │   ├── CalculatorApp.jsx
        │   ├── TerminalApp.jsx
        │   ├── FileManagerApp.jsx
        │   ├── BrowserApp.jsx
        │   ├── NotepadApp.jsx
        │   ├── SettingsApp.jsx
        │   ├── MediaPlayerApp.jsx
        │   ├── AppStoreApp.jsx
        │   ├── PaintApp.jsx
        │   └── RecycleBinApp.jsx
        ├── utils/
        │   └── api.js         ← Axios with JWT interceptors
        └── styles/
            ├── global.css
            └── desktop.css
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router 6, Context API |
| Styling | CSS3, Glassmorphism, CSS Variables |
| Animations | Framer Motion, CSS animations |
| HTTP Client | Axios (with JWT interceptors) |
| Real-time | Socket.io client |
| Backend | Node.js, Express.js |
| Auth | JWT + bcryptjs |
| Database | SQLite (better-sqlite3, WAL mode) |
| File uploads | Multer |
| Real-time | Socket.io |

---

## 🔌 API Reference

All protected routes require: `Authorization: Bearer <token>`

### Auth `/api/auth`
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/register` | `{username, email, password}` | Create account |
| POST | `/login` | `{username, password, rememberMe}` | Sign in → token |
| GET | `/profile` | — | Get user + settings |
| PUT | `/profile` | `{username?, email?, newPassword?}` | Update profile |
| POST | `/avatar` | `multipart: avatar` | Upload avatar |
| POST | `/logout` | — | Sign out |

### Files `/api/files`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List dir (`?parentId=`) |
| GET | `/search?q=` | Search files |
| GET | `/stats` | Storage stats |
| GET | `/recycle` | Recycle bin contents |
| GET | `/:id` | Get single node |
| POST | `/folder` | Create folder |
| POST | `/text` | Create text file |
| POST | `/upload` | Upload file (multipart) |
| PUT | `/:id/content` | Save file content |
| PUT | `/:id/rename` | Rename |
| PUT | `/:id/move` | Move to folder |
| PUT | `/recycle/:id/restore` | Restore from bin |
| DELETE | `/recycle/empty` | Empty bin permanently |
| DELETE | `/:id` | Soft-delete → bin |

### Notes `/api/notes`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all notes |
| GET | `/search?q=` | Search notes |
| GET | `/:id` | Get note |
| POST | `/` | Create note |
| PUT | `/:id` | Update/autosave |
| PUT | `/:id/pin` | Toggle pin |
| DELETE | `/:id` | Delete |

### Terminal `/api/terminal`
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/exec` | `{command}` | Execute command |
| GET | `/history` | — | Command history |
| DELETE | `/history` | — | Clear history |

### System `/api/system`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/metrics` | CPU, RAM, disk, network |
| GET | `/info` | OS info |

### Apps `/api/apps`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/store` | All available apps |
| GET | `/installed` | User's installed apps |
| POST | `/install` | Install app (`{appId}`) |
| DELETE | `/:appId` | Uninstall app |

### Notifications `/api/notifications`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications |
| GET | `/unread` | Unread count |
| POST | `/` | Create notification |
| PUT | `/:id/read` | Mark read |
| PUT | `/read/all` | Mark all read |
| DELETE | `/` | Clear all |

### Browser `/api/browser`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/bookmarks` | List bookmarks |
| POST | `/bookmarks` | Add bookmark |
| DELETE | `/bookmarks/:id` | Remove bookmark |
| GET | `/history` | Browse history |
| POST | `/history` | Add history entry |
| DELETE | `/history` | Clear history |

---

## 🔌 Socket.io Events

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `notification` | `{title, body, icon, time}` | Real-time notification |
| `system:metrics` | `{cpu, time}` | System metrics every 5s |
| `system:ready` | `{message, time}` | Connection established |
| `auth:login` | `{username}` | Login event |

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `notification:send` | `{title, body, icon}` | Broadcast notification |
| `terminal:input` | `{command}` | Terminal stream |
| `window:state` | state object | Sync window state |

---

## 🖥️ Built-in Apps

| App | Features |
|-----|---------|
| 🧮 **Calculator** | Full arithmetic, keyboard support, expression display |
| ⬛ **Terminal** | 20+ commands, command history (↑↓), real backend execution |
| 📁 **File Manager** | Grid/list view, upload, create, rename, delete, search, breadcrumb |
| 🌐 **Browser** | Bookmarks, history, quick links, search — all persisted to DB |
| 📝 **Notepad** | Multi-note sidebar, autosave, pin notes, word/char count |
| ⚙️ **Settings** | Wallpaper, accent color, live CPU/RAM meters, account management |
| 🎵 **Media Player** | Demo playlist, play/pause/seek, shuffle/repeat, volume |
| 🛒 **App Store** | Browse, install, open, uninstall apps — synced to user profile |
| 🎨 **Paint** | Pen, eraser, spray, fill, color picker, undo/redo, save PNG |
| 🗑️ **Recycle Bin** | Restore or permanently delete files |

---

## ⌨️ Terminal Commands

```
help      clear     date      time      echo
pwd       ls        cd        mkdir     touch
rm        cat       whoami    uname     uptime
ps        history   node --version     npm --version
ping [host]
```

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT** tokens (24h / 30d with rememberMe)
- All file operations scoped to authenticated user
- Multer blocks dangerous file extensions (`.exe`, `.bat`, `.sh`, etc.)
- Input sanitization on all routes
- SQLite foreign keys enforced

---

## 🎨 Features

- **Window management**: drag, resize, minimize, maximize, snap to left/right edge
- **Multi-window**: open multiple apps simultaneously, z-order focus management
- **Live notifications**: real-time via Socket.io + notification history
- **Virtual file system**: SQLite-backed per-user FS with soft-delete recycle bin
- **Persistent notes**: autosave every 1.5 seconds of inactivity
- **Animated wallpaper**: canvas starfield with twinkling stars
- **Theme engine**: 6 wallpapers, 8 accent colors, all persisted to DB
- **Right-click context menu** on desktop
- **Calendar popup** with live clock
- **System metrics**: live CPU/RAM polling from real OS values

---

## 📦 Environment Variables

```env
PORT=5000
JWT_SECRET=change-this-in-production
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🚀 Production Build

```bash
# Build React frontend
cd frontend && npm run build

# Serve static build from Express
# Add to backend/server.js:
# app.use(express.static(path.join(__dirname, '../frontend/build')));
# app.get('*', (req,res) => res.sendFile(path.join(__dirname,'../frontend/build/index.html')));

cd backend && npm start
```
