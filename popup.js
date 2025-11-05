document.addEventListener('DOMContentLoaded', () => {
  // Basic UI refs
  const urlInput = document.getElementById('urlInput');
  const noteInput = document.getElementById('noteInput');
  const addBtn = document.getElementById('addBtn');
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');

  // Validate firebaseConfig variable exists
  if (typeof firebaseConfig === 'undefined') {
    grid.innerHTML = '<div style="padding:12px;color:#b00">Missing firebase-config.js — open README and paste your Firebase config.</div>';
    empty.style.display = 'none';
    addBtn.disabled = true;
    return;
  }

  // Initialize Firebase
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.error('Firebase init error', err);
    grid.innerHTML = '<div style="padding:12px;color:#b00">Failed to initialize Firebase. Check console.</div>';
    addBtn.disabled = true;
    return;
  }

  const auth = firebase.auth();
  const db = firebase.firestore();
  const pinsCol = db.collection('pins');

  // Auth UI refs
  const authArea = document.getElementById('authArea');
  const authForm = document.getElementById('authForm');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const signInBtn = document.getElementById('signInBtn');
  const registerBtn = document.getElementById('registerBtn');
  const userInfo = document.getElementById('userInfo');
  const userEmailSpan = document.getElementById('userEmail');
  const signOutBtn = document.getElementById('signOutBtn');

  // Render helpers
  function makeCard(doc, idx) {
    const data = doc.data();
    const container = document.createElement('div');
    container.className = 'card variant-' + ((idx % 6) + 1);

    const del = document.createElement('button');
    del.className = 'del';
    del.title = 'Delete pin';
    del.innerHTML = '&times;';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Delete this pin?')) {
        pinsCol.doc(doc.id).delete().catch(err => console.error(err));
      }
    });
    container.appendChild(del);

    const a = document.createElement('a');
    a.className = 'link';
    a.href = data.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = data.title || data.url;
    container.appendChild(a);

    if (data.note) {
      const note = document.createElement('div');
      note.className = 'note';
      note.textContent = data.note;
      container.appendChild(note);
    }

    return container;
  }

  function renderList(docs) {
    grid.innerHTML = '';
    if (!docs.length) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    docs.forEach((doc, idx) => {
      const card = makeCard(doc, idx);
      grid.appendChild(card);
    });
  }

  // Real-time listener (always active, read-only)
  pinsCol.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    const docs = [];
    snapshot.forEach(d => docs.push(d));
    renderList(docs);
  }, err => {
    console.error('Firestore listener failed', err);
    grid.innerHTML = '<div style="padding:12px;color:#b00">Could not subscribe to updates. Check Firestore rules and console.</div>';
  });

  // Auth state handling
  function showSignedIn(user) {
    userInfo.style.display = 'flex';
    authForm.style.display = 'none';
    userEmailSpan.textContent = user.email || user.uid;
    addBtn.disabled = false;
  }

  function showSignedOut() {
    userInfo.style.display = 'none';
    authForm.style.display = 'flex';
    userEmailSpan.textContent = '';
    addBtn.disabled = true;
  }

  auth.onAuthStateChanged(user => {
    if (user) {
      showSignedIn(user);
    } else {
      showSignedOut();
    }
  });

  signOutBtn.addEventListener('click', () => auth.signOut());

  signInBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const pw = passwordInput.value;
    if (!email || !pw) return alert('Provide email and password');
    signInBtn.disabled = true;
    auth.signInWithEmailAndPassword(email, pw)
      .catch(e => alert('Sign in failed: ' + e.message))
      .finally(()=> signInBtn.disabled = false);
  });

  registerBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const pw = passwordInput.value;
    if (!email || !pw) return alert('Provide email and password to register');
    registerBtn.disabled = true;
    auth.createUserWithEmailAndPassword(email, pw)
      .then(cred => {
        // show UID to user so they can share with admin (or copy it)
        const uid = cred.user.uid;
        alert('Registered. Your UID: ' + uid + '\nShare this UID with the project owner to add you to allowed writers in Firestore rules.');
      })
      .catch(e => alert('Register failed: ' + e.message))
      .finally(()=> registerBtn.disabled = false);
  });

  // Helpers
  function isValidUrl(s) {
    try {
      const u = new URL(s);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) { return false; }
  }

  function extractTitleFromUrl(s) {
    try { return (new URL(s)).hostname.replace('www.',''); } catch(e){return s}
  }

  // Add pin handler (requires auth)
  addBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return alert('You must sign in to add pins.');

    const url = urlInput.value.trim();
    const note = noteInput.value.trim();
    if (!url) return;
    if (!isValidUrl(url)) {
      alert('Please enter a valid http(s) URL');
      return;
    }

    const title = extractTitleFromUrl(url);
    addBtn.disabled = true;
    pinsCol.add({
      url, note: note || '', title, createdAt: firebase.firestore.FieldValue.serverTimestamp(), ownerUid: user.uid
    }).then(() => {
      urlInput.value = '';
      noteInput.value = '';
      urlInput.focus();
    }).catch(err => {
      console.error('Add failed', err);
      alert('Failed to add pin. See console.');
    }).finally(()=> addBtn.disabled = false);
  });

  // allow Enter to submit from URL input
  urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });
  noteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });
});
