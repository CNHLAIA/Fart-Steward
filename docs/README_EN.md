# Fart Manager 💨

**[中文版](../README.md)**

A professional fart recording and analysis tool that helps you track data for every "fart event" in your life.

> Life's big events include fart events too. Start recording life from the details.

## 💨 Features

### User System
- User registration and login (JWT authentication)
- Personal data isolation for privacy protection

### Fart Record Management
- Full CRUD operations (Create, Read, Update, Delete)
- Record detailed information: time, duration, type, smell, temperature sensation, moisture sensation, notes
- Support for custom fart types
- Date range filtering
- Paginated browsing of history records

### Data Analysis (7 Charts)
- **Daily Statistics** - View daily fart count trends
- **Weekly Trends** - Long-term changes by week
- **Type Distribution** - Analysis of different type proportions
- **Smell Distribution** - Odor level statistics
- **Duration Distribution** - Fart duration analysis
- **24x7 Hourly Heatmap** - Find your "golden hours"
- **Cross Analysis** - Correlation analysis between duration and smell

### Data Export
- Export to CSV format
- Export to Excel (xlsx) format
- Filter export content by date range

### Internationalization 🌐
- Supports Chinese and English interfaces
- Chinese by default
- One-click language switching with automatic preference saving

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose

### One-Click Start

```bash
# 1. Copy environment variable file
cp .env.example .env

# 2. Start services
docker-compose up -d

# 3. Visit after services are ready
open http://localhost
```

After services start:
- Frontend: `http://localhost`
- Backend API: `http://localhost:5000`

### Stop Services

```bash
docker-compose down
```

### Clear Data

```bash
# Stop services and delete database
docker-compose down
rm -rf data
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Flask + SQLAlchemy |
| Database | SQLite |
| Deployment | Docker + Docker Compose |
| Charts | ECharts |
| Auth | JWT |
| i18n | react-i18next |

## 📚 Documentation Links

- [中文版](../README.md)
- [API Reference](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Architecture](ARCHITECTURE.md)

## 📁 Project Structure

```
.
├── backend/          # Flask backend
│   ├── routes/       # API routes
│   ├── auth.py       # Authentication module
│   └── models.py     # Data models
├── frontend/         # React frontend
│   └── src/
│       ├── pages/    # Page components
│       └── components/ # Reusable components
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── .env.example
```

## 🤝 Contributing

Issues and Pull Requests are welcome.

## 📄 License

AGPL-3.0 License
