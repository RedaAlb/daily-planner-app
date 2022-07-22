# Daily Planner App

A daily planner app using React web with Capacitor for native mobile platforms.

I initially created this daily planner in [paper format](paper_version.png), which I used for over 2 years, so I decided to make this app to go paperless.


# Demo

Please note that for the demo, there is no data persistence since Firebase will not be setup for the demo. When creating the app for yourself, please follow instructions below on how to get Firebase setup for data persistence.

[Demo](https://redaalb.github.io/daily-planner-app/)


# To build/deploy as a "native" app using Capacitor with Firebase

## Install node modules
```
cd .\daily-planner-app\
npm install
```

## Initialise Capacitor
```
npx cap init "Daily Planner" "com.dailyplanner.app"
```

## Setup Firebase
- Create a [Firebase](https://firebase.google.com/) account, then a project, and then a realtime database for that created project.
- Go to the project settings, there you will see values you need to gain access to the project, e.g. your api key.
- Create a file called `.env.local`, and ensure this file is ignored in `.gitignore`, in that file, paste in your Firebase values from the project settings page in this exact format:

```
REACT_APP_API_KEY="value"
REACT_APP_AUTH_DOMAIN="value"
REACT_APP_DATABASE_URL="value"
REACT_APP_PROJECT_ID="value"
REACT_APP_STORAGE_BUCKET="value"
REACT_APP_MESSAGING_SENDER_ID="value"
REACT_APP_APP_ID="value"
```

## Build web app
```
npm run build
```

## Install native platforms needed
```
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

npx cap copy
npx cap copy web
```

## Deploy

Open the output folder in your chosen native platform IDE and install to device.


# To make changes

After changes made, run:
```
npm run build
npx cap sync
```