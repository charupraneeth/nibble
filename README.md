# Nibble - AI Nutrition Tracker

A smart nutrition tracking app with AI-powered food analysis and personalized meal suggestions.

## Features

- 📸 **Image & Text Analysis** - Upload food photos or describe meals
- 🤖 **AI Integration** - OpenAI GPT-4 Vision for accurate nutrition data
- 📊 **Smart Tracking** - Monitor calories, protein, carbs, and fats
- 💡 **Meal Suggestions** - Get personalized recommendations based on your needs
- 📱 **Mobile Responsive** - Works great on all devices
- 🔒 **Privacy First** - Data stored locally in your browser

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT-4 Vision API
- **Storage**: LocalStorage (Supabase-ready)

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm run dev

# Build for production
pnpm run build
```

### Configuration

1. Go to **Settings** in the app
2. Select **OpenAI (Real Analysis)**
3. Enter your OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

## Deployment

### Cloudflare Pages

```bash
# Deploy to production
pnpm run deploy

# Deploy preview
pnpm run preview-deploy
```

Or connect your GitHub repo to Cloudflare Pages:
- Build command: `pnpm run build`
- Build output: `dist`

## Project Structure

```
src/
├── features/          # Feature modules
│   ├── dashboard/     # Main dashboard
│   ├── food-entry/    # Food logging
│   ├── onboarding/    # User setup
│   ├── settings/      # App settings
│   └── suggestions/   # Meal recommendations
├── services/          # Service layer
│   ├── ai/           # AI providers (Mock, OpenAI)
│   └── storage/      # Storage providers (LocalStorage)
└── components/       # Reusable UI components
```

## Future Enhancements

- [ ] Supabase integration for cloud sync
- [ ] Weekly/monthly analytics
- [ ] Food database for quick-add
- [ ] Export data (JSON/CSV)
- [ ] Water intake tracking
- [ ] Meal timing labels

## License

MIT
