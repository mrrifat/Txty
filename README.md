# Txty - Beautiful Text Paste & Share

A modern, beautiful text paste and share application built with React and Node.js. Share text snippets instantly with password protection and expiration options.

## Features

- **Instant Sharing**: Create a paste and get a shareable link instantly
- **Password Protection**: Secure your pastes with optional password protection
- **Auto-Expiration**: Set pastes to automatically expire (1h, 1d, 7d, 30d, or never)
- **User Accounts**: Register to manage and delete your pastes
- **Beautiful UI**: Modern, responsive design with Tailwind CSS
- **Simple & Fast**: No complexity, just paste and share

## Screenshots

- **Home Page**: Create pastes with a beautiful, intuitive interface
- **View Paste**: Clean, readable paste viewing experience
- **Dashboard**: Manage all your pastes in one place
- **Password Protection**: Secure pastes with password unlock screen

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide Icons
- React Hot Toast

### Backend
- Node.js
- Express
- SQLite (better-sqlite3)
- JWT Authentication
- bcrypt for password hashing
- nanoid for unique IDs

## Installation

### Prerequisites
- Node.js 18+ and npm

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Txty
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Create environment file**
```bash
cp .env.example .env
```

Edit `.env` and set your JWT secret:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
```

4. **Run the application**
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend dev server on http://localhost:5173

## Usage

### Creating a Paste

1. Go to the home page
2. Enter your text (optionally add a title)
3. Optional: Set a password for protection
4. Optional: Set an expiration time
5. Click "Create & Share"
6. Link is automatically copied to clipboard!

### Password Protection

When creating a paste, add a password in the "Password" field. Viewers will need to enter this password to see the content.

### User Accounts

**Register**:
- Click "Register" in the navigation
- Provide username, email, and password
- You're automatically logged in

**Benefits**:
- View all your pastes in the dashboard
- Delete pastes anytime
- Track views and creation dates

### Managing Pastes

1. Login to your account
2. Go to "Dashboard"
3. View all your pastes
4. Click the trash icon to delete a paste
5. Click the link icon to view a paste

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Pastes
- `POST /api/paste` - Create new paste
- `GET /api/paste/:id` - Get paste by ID
- `POST /api/paste/:id/unlock` - Unlock password-protected paste
- `GET /api/paste/user/my-pastes` - Get user's pastes (requires auth)
- `DELETE /api/paste/:id` - Delete paste (requires auth)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Pastes Table
```sql
CREATE TABLE pastes (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  password TEXT,
  user_id INTEGER,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  views INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

## Production Deployment

1. **Build the frontend**
```bash
cd client
npm run build
```

2. **Set environment variables**
```bash
export NODE_ENV=production
export JWT_SECRET=your-production-secret
export PORT=3000
```

3. **Start the server**
```bash
npm start
```

The server will serve the built frontend files automatically.

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- SQL injection prevention with prepared statements
- Password-protected pastes
- Auto-expiring pastes
- CORS enabled for API security

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ using React and Node.js
