# Vercel Deployment Guide for InnoviaHub Frontend

## Overview

This guide covers deploying the InnoviaHub Angular frontend to Vercel while connecting to your production backend API at `innoviahub.hellbergsystems.se:8004`.

## Prerequisites

- GitHub repository pushed to your account
- Vercel account connected to GitHub
- OpenAI API key (keep this secure!)

                  ## ⚠️ Security Warning

**NEVER commit API keys to GitHub!**

- The OpenAI API key is now stored only in environment variables
- Use `.env` file for local development (already in .gitignore)
- Set environment variables in Vercel dashboard for production

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your `InnoviaHubJoel` repository
4. Select the `frontend` folder as the root directory

### 2. Configure Build Settings

Vercel should auto-detect Angular, but verify these settings:

- **Framework Preset**: Angular
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist/frontend/browser`
- **Install Command**: `npm install`

### 3. Environment Variables

Add these environment variables in Vercel dashboard:

    NG_APP_API_URL=https://innoviahub.hellbergsystems.se:8004
    NG_APP_HUB_URL=wss://innoviahub.hellbergsystems.se:8004/hubs/bookings
    NG_APP_LOGIN_REDIRECT_URL=https://your-vercel-domain.vercel.app/profil
    NG_APP_LOGOUT_REDIRECT_URL=https://your-vercel-domain.vercel.app/logga-in
    NG_APP_OPENAI_API_KEY=your-actual-openai-api-key-here

### 4. Update Backend CORS

After deployment, update your backend `Program.cs` to include your Vercel domain:

    .WithOrigins("http://localhost:4200", "https://your-vercel-domain.vercel.app")

### 5. Update Azure AD Redirect URIs

In your Azure AD app registration, add your Vercel domain to:

- Redirect URIs: `https://your-vercel-domain.vercel.app/profil`
- Logout URLs: `https://your-vercel-domain.vercel.app/logga-in`

## File Structure for Vercel

    frontend/
    ├── vercel.json              # Vercel configuration
    ├── .env.vercel.example      # Environment variables template
    ├── scripts/generate-env.js  # Runs during build to create env.js
    ├── package.json            # Contains prebuild script
    └── src/assets/env.js       # Generated at build time

## Build Process

1. Vercel runs `npm install`
2. `prebuild` script executes `node scripts/generate-env.js`
3. Environment variables are injected into `src/assets/env.js`
4. Angular build runs with `ng build`
5. Static files deployed to Vercel CDN

## Troubleshooting

### Build Fails

- Check that `dotenv` is installed: `npm install dotenv`
- Verify `scripts/generate-env.js` is present
- Ensure environment variables are set in Vercel dashboard

### Authentication Issues

- Verify Azure AD redirect URIs include Vercel domain
- Check that CORS policy includes Vercel domain in backend
- Confirm redirect URLs in environment variables match Vercel domain

### API Connection Issues

- Verify `NG_APP_API_URL` points to `https://innoviahub.hellbergsystems.se:8004`
- Check that backend CORS allows your Vercel domain
- Ensure backend is running and accessible

## Development vs Production

### Local Development

- Uses `http://localhost:5184` for API (when running backend locally)
- Uses `http://localhost:4200` for frontend
- Environment generated with local defaults

### Vercel Production

- Uses `https://innoviahub.hellbergsystems.se:8004` for API
- Uses your Vercel domain for frontend
- Environment variables override defaults

## Post-Deployment Checklist

- [ ] Frontend loads at Vercel URL
- [ ] Authentication works (login/logout)
- [ ] API calls reach your backend successfully
- [ ] SignalR connection established
- [ ] OpenAI integration works
- [ ] All routes work with SPA routing
