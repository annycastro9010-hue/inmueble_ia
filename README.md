# Inmueble Virtual Showcase - Vercel Ready 🚀

This is a professional real estate selling tool built with **Next.js 14**, **Tailwind CSS**, and **Framer Motion**. It features AI-powered staging and automated video generation.

## 🌟 Key Features
- **Auto-Playing Hero Video**: Cinematic first impression.
- **Hormozi Style Branding**: High-impact yellow/black aesthetic.
- **Virtual Tour Viewer**: Interactive cinematic property exploration.
- **Builder Dashboard**: Upload and manage property photos for AI processing.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom Animations
- **Video Engine**: FFmpeg.wasm (Client-side)
- **AI Staging**: Replicate (API)

## 🚀 Deployment to Vercel

### 1. Environment Variables
Add these to your Vercel project settings:
```bash
REPLICATE_API_TOKEN=your_api_token_here
NEXT_PUBLIC_SITE_URL=your_deployment_url_here
```

### 2. Cross-Origin Isolation
The project is pre-configured with the necessary headers in `next.config.mjs` to support **SharedArrayBuffer**, which is required for the Video Engine (`ffmpeg.wasm`) to run on Vercel.

### 3. Local Development
```bash
npm install
npm run dev
```

## 📂 Project Structure
- `/src/app`: Routes and Pages (Landing, Dashboard).
- `/src/components`: UI components including the `TourViewer`.
- `/src/lib`: Logic for Video Generation and AI Staging.
