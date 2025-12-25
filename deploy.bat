@echo off
REM Deploy script for Maa Care (Windows)
REM Usage: deploy.bat [environment]
REM Example: deploy.bat production

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

echo.
echo ========================================
echo   Deploying Maa Care to %ENVIRONMENT%
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found
    echo Please create a .env file with required environment variables:
    echo   VITE_SUPABASE_URL
    echo   VITE_SUPABASE_ANON_KEY
    echo   VITE_GEMINI_API_KEY
    exit /b 1
)

REM Install dependencies
echo [1/4] Installing dependencies...
call npm ci
if errorlevel 1 (
    echo [ERROR] Dependency installation failed
    exit /b 1
)

REM Run type check
echo.
echo [2/4] Running TypeScript type check...
call npx tsc --noEmit
if errorlevel 1 (
    echo [WARNING] Type check found issues, but continuing...
)

REM Build the application
echo.
echo [3/4] Building application for %ENVIRONMENT%...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    exit /b 1
)

REM Check if build was successful
if not exist dist (
    echo [ERROR] Build failed: dist directory not found
    exit /b 1
)

echo.
echo [4/4] Build completed successfully!
echo Built files are in the 'dist' directory

REM Optional: Deploy to specific platforms
if /i "%ENVIRONMENT%"=="vercel" (
    echo.
    echo Deploying to Vercel...
    call npx vercel --prod
) else if /i "%ENVIRONMENT%"=="netlify" (
    echo.
    echo Deploying to Netlify...
    call npx netlify deploy --prod --dir=dist
) else if /i "%ENVIRONMENT%"=="docker" (
    echo.
    echo Building Docker image...
    docker build -t maa-care:latest .
    if errorlevel 1 (
        echo [ERROR] Docker build failed
        exit /b 1
    )
    echo Docker image built successfully
    echo To run: docker-compose up -d
) else (
    echo.
    echo Deployment complete!
    echo.
    echo Manual deployment steps:
    echo 1. Upload the 'dist' folder to your web server
    echo 2. Configure your web server to serve index.html for all routes
    echo 3. Ensure environment variables are set on the server
)

echo.
echo ========================================
echo   Deployment process finished!
echo ========================================
echo.

endlocal
