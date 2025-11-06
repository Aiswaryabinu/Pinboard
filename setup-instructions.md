# 🔥 Firebase Setup Instructions

If you want to publish this extension publicly, follow these steps:

## Option 1: User-Configurable Firebase

1. **Remove firebase-config.js** from the extension
2. **Add setup UI** where users enter their own Firebase config
3. **Store config locally** using Chrome storage API

## Option 2: Shared Public Firebase

1. **Create a new Firebase project** for public use
2. **Set up proper security rules** for multi-user access
3. **Use that config** in the public version

## Option 3: GitHub Releases

1. **Upload to GitHub** (you already have the repo!)
2. **Create releases** with packaged .zip files
3. **Friends download** and install manually
4. **Much easier than folder sharing**

## Chrome Web Store Publishing Checklist

- [ ] Remove personal Firebase config
- [ ] Add setup instructions
- [ ] Create app icons (16x16, 48x48, 128x128)
- [ ] Write store description
- [ ] Take screenshots
- [ ] Test with fresh Firebase project
- [ ] Package as .zip file
- [ ] Submit to Chrome Web Store

## Recommended Approach

For private use with friends: **GitHub Releases**
For public distribution: **Chrome Web Store with user setup**