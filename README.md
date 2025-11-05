# Shared Pinboard — Chrome Extension

This Chrome extension is a small collaborative pinboard. It uses Firebase Firestore for real-time shared storage so up to 3 users (or more) can see pins added/deleted instantly.

Files added
- `manifest.json` — MV3 manifest and CSP allowing Firebase CDN
- `popup.html` — extension popup UI
- `popup.css` — styles (modern cards, responsive 2-column grid)
- `popup.js` — main logic: initializes Firebase, listens to Firestore `pins` collection, add/delete pins
- `firebase-config.js` — you must paste your Firebase web app config here

Quick setup
1. Create a Firebase project at https://console.firebase.google.com
2. In your project, go to "Build > Firestore Database" and create a database (start in test mode for easy dev).
3. Go to "Project settings" (gear) -> "Your apps" and register a Web app. Copy the config object.
4. Open `firebase-config.js` and replace the placeholder `firebaseConfig` object with the config you copied.

Auth & restricting writes to 3 users (recommended)
------------------------------------------------
This section shows an optional, low-effort way to keep writes limited to exactly three users (your 3 colleagues) while keeping reads open for everyone.

1) In the popup you'll now see authentication fields (Email & Password). Register three accounts (each of your 3 people should register once using the extension). After registration you'll get an alert showing your UID — copy that UID.

2) In the Firebase Console go to "Firestore Database" → "Rules" and use a rule like the one below. Replace <UID1>, <UID2>, <UID3> with the three UIDs you collected from the users.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pins/{doc} {
      // allow read to anyone
      allow read: if true;
      // allow write only for the three specified UIDs
      allow create, update, delete: if request.auth != null && request.auth.uid in ["<UID1>", "<UID2>", "<UID3>"];
    }
  }
}
```

3) Save rules. Now only those three authenticated users can add/delete pins. The extension will still show real-time updates for everyone.

How to get a user's UID (if you miss the alert):
- In Firebase Console → Authentication → Users, click a user to view their UID.

Notes:
- This approach uses the free Spark plan and Email/Password auth. You do not need to add a billing method for this.
- Keep the three UIDs secret among your group. If you need me to add the UIDs into your rules, copy them here and I can paste the final rules snippet for you.

Firestore rules (dev)
If you started in test mode you'll be able to read/write; for more control use rules like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pins/{doc} {
      allow read, write: if true; // change for production
    }
  }
}
```

How to load the extension in Chrome
1. Open chrome://extensions/
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked" and choose the `pinboard` folder (the directory containing `manifest.json`)
4. Click the extension icon (puzzle) and pin the extension so you can click the popup.

Usage
- Paste an http(s) link into the first input. Add an optional short note. Click "Add".
- Other users with the extension + same Firebase config will see the new pin in real-time.
- Click the link text to open it in a new tab. Click the × button to delete a pin.

Security & production notes
- This sample uses a Firestore collection named `pins`. For production do not keep rules that allow open writes. Add authentication (Firebase Auth) and secure rules so only authorized users can write.
- You may want to add features such as usernames, timestamps, or link title scraping (careful with CORS).

If you want, I can:
- Add basic Firebase Auth and restrict to 3 users by UID.
- Add small tests or a build step bundling a modern SDK instead of using the CDN.
