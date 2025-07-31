# PeerUp - Student Peer Matching Platform

A Next.js application for connecting students with mentors and study buddies.

## Features

- 🔐 Google Authentication
- 👥 Smart peer matching algorithm
- 📱 Responsive design
- 🎯 Goal tracking
- 💬 Real-time messaging (coming soon)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with your Firebase configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# For API routes (optional for development)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Netlify Deployment

1. Connect your repository to Netlify
2. Set the build command: `npm run build`
3. Set the publish directory: `.next`
4. Add the following environment variables in Netlify:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - `FIREBASE_PROJECT_ID` (for API routes)
   - `FIREBASE_CLIENT_EMAIL` (for API routes)
   - `FIREBASE_PRIVATE_KEY` (for API routes)

## Project Structure

- `app/` - Next.js 13+ app directory
- `components/` - Reusable React components
- `lib/` - Utility functions and Firebase configuration
- `public/` - Static assets
- `styles/` - Global styles

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Deployment**: Netlify

## API Routes

- `GET /api/match` - Health check endpoint
- `POST /api/match` - Smart matching algorithm

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License 