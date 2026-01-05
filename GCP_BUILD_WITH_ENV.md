# Building and Deploying with Environment Variables

## Problem
The React app requires environment variables (`REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, etc.) to be available **during the build process**, not just at runtime. These need to be passed as Docker build arguments.

## Solution

### Option 1: Using `gcloud builds submit` with Substitutions (Recommended)

Pass environment variables as build substitutions:

```bash
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/secure-bolt-482820-s6/agora-react-repo/agora-react:latest \
  --project=secure-bolt-482820-s6 \
  --substitutions=_REACT_APP_SUPABASE_URL="YOUR_SUPABASE_URL",_REACT_APP_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY",_REACT_APP_ENVIRONMENT="production",_REACT_APP_WEATHER_API_KEY="YOUR_WEATHER_KEY"
```

**Replace the placeholders:**
- `YOUR_SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `YOUR_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `YOUR_WEATHER_KEY` - Your weather API key (optional, can be empty string)

### Option 2: Using `gcloud builds submit` with Build Args Directly

If substitutions don't work, use `--config` with a modified command or pass build args:

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REACT_APP_SUPABASE_URL="YOUR_SUPABASE_URL",_REACT_APP_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY",_REACT_APP_ENVIRONMENT="production",_REACT_APP_WEATHER_API_KEY="YOUR_WEATHER_KEY" \
  --project=secure-bolt-482820-s6
```

### Option 3: Manual Docker Build (for testing)

If you want to test locally first:

```bash
docker build \
  --build-arg REACT_APP_SUPABASE_URL="YOUR_SUPABASE_URL" \
  --build-arg REACT_APP_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY" \
  --build-arg REACT_APP_ENVIRONMENT="production" \
  --build-arg REACT_APP_WEATHER_API_KEY="YOUR_WEATHER_KEY" \
  -t agora-react:latest .
```

## Getting Your Environment Variable Values

### Supabase URL and Key

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: **Settings → API**
4. Copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public** key → `REACT_APP_SUPABASE_ANON_KEY`

### Weather API Key (Optional)

If you're using weather features:
1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Generate an API key
3. Use it for `REACT_APP_WEATHER_API_KEY`

## Complete Deployment Steps

### 1. Pull Latest Code (in Cloud Shell)

```bash
cd ~/agora9-react-render
git pull origin main
```

### 2. Build with Environment Variables

```bash
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/secure-bolt-482820-s6/agora-react-repo/agora-react:latest \
  --project=secure-bolt-482820-s6 \
  --substitutions=_REACT_APP_SUPABASE_URL="https://YOUR_PROJECT.supabase.co",_REACT_APP_SUPABASE_ANON_KEY="YOUR_ANON_KEY",_REACT_APP_ENVIRONMENT="production",_REACT_APP_WEATHER_API_KEY=""
```

**⚠️ Important:** Replace the placeholder values with your actual values!

### 3. Deploy to Cloud Run

```bash
gcloud run deploy agora-react \
  --image us-central1-docker.pkg.dev/secure-bolt-482820-s6/agora-react-repo/agora-react:latest \
  --region us-central1 \
  --project secure-bolt-482820-s6 \
  --allow-unauthenticated
```

## Security Note

For production, consider using **Google Secret Manager** instead of passing values directly:

1. Store secrets in Secret Manager
2. Reference them in `cloudbuild.yaml` using `secretEnv`
3. Access them in build steps

This is more secure but requires additional setup.

## Troubleshooting

### Error: "Missing required environment variables"

This means the build arguments weren't passed correctly. Check:
- Are you using `--substitutions` with the `_` prefix?
- Are the values properly quoted?
- Did you replace the placeholder values?

### Error: "Build failed"

Check the Cloud Build logs:
```bash
gcloud builds list --project=secure-bolt-482820-s6
gcloud builds log BUILD_ID --project=secure-bolt-482820-s6
```

### App loads but shows empty data

This usually means:
- Environment variables were set correctly (app loaded)
- But API calls are failing (check Supabase URL/key)
- Or CORS issues (check Supabase settings)
