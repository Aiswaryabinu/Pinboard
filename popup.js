document.addEventListener('DOMContentLoaded', () => {
  // Basic UI refs
  const urlInput = document.getElementById('urlInput');
  const noteInput = document.getElementById('noteInput');
  const categorySelect = document.getElementById('categorySelect');
  const addBtn = document.getElementById('addBtn');
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  
  // Search refs
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  // Validate firebaseConfig variable exists
  if (typeof firebaseConfig === 'undefined') {
    grid.innerHTML = '<div style="padding:12px;color:#b00">Missing firebase-config.js — open README and paste your Firebase config.</div>';
    empty.style.display = 'none';
    addBtn.disabled = true;
    return;
  }

  // Check if config has real values (not placeholders)
  if (firebaseConfig.apiKey === 'YOUR_API_KEY_HERE' || !firebaseConfig.apiKey) {
    grid.innerHTML = '<div style="padding:12px;color:#b00">Firebase config not set up! Please add your real Firebase project config to firebase-config.js</div>';
    empty.style.display = 'none';
    addBtn.disabled = true;
    return;
  }

  // Initialize Firebase
  try {
    console.log('Initializing Firebase with config:', firebaseConfig); // Debug log
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully'); // Debug log
  } catch (err) {
    console.error('Firebase init error', err);
    grid.innerHTML = '<div style="padding:12px;color:#b00">Failed to initialize Firebase. Check console.</div>';
    addBtn.disabled = true;
    return;
  }

  const auth = firebase.auth();
  const db = firebase.firestore();
  console.log('Auth and Firestore initialized'); // Debug log
  
  const pinsCol = db.collection('pins'); // Initialize pinsCol here
  let unsubscribe;
  let allPins = []; // Store all pins for search functionality

  // Auth UI refs
  const authArea = document.getElementById('authArea');
  const authForm = document.getElementById('authForm');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const signInBtn = document.getElementById('signInBtn');
  const registerBtn = document.getElementById('registerBtn');
  const headerUserInfo = document.getElementById('headerUserInfo');
  const headerUserEmail = document.getElementById('headerUserEmail');
  const signOutBtn = document.getElementById('signOutBtn');

  // Render helpers
  function makeCard(doc, idx) {
    const data = doc.data();
    const container = document.createElement('div');
    container.className = 'card';

    // Left side - content
    const content = document.createElement('div');
    content.className = 'card-content';

    const a = document.createElement('a');
    a.className = 'link';
    a.href = data.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = data.title || data.url;
    content.appendChild(a);

    if (data.note) {
      const note = document.createElement('div');
      note.className = 'note';
      note.textContent = data.note;
      content.appendChild(note);
    }

    // Right side - actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    // Add category and delete button in a row
    const actionsRow = document.createElement('div');
    actionsRow.className = 'actions-row';

    // Add category if exists
    if (data.category) {
      const category = document.createElement('div');
      category.className = `card-category ${data.category}`;
      category.textContent = data.category.toUpperCase();
      actionsRow.appendChild(category);
    }

    const del = document.createElement('button');
    del.className = 'del';
    del.title = 'Delete pin';
    del.innerHTML = '🗑';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Delete this pin?')) {
        pinsCol.doc(doc.id).delete().catch(err => console.error(err));
      }
    });
    actionsRow.appendChild(del);

    actions.appendChild(actionsRow);

    container.appendChild(content);
    container.appendChild(actions);
    return container;
  }

  function renderList(docs) {
    grid.innerHTML = '';
    if (!docs.length) {
      empty.style.display = 'block';
      empty.textContent = searchInput.value.trim() ? 'No matching links found' : 'No links added yet';
      return;
    }
    empty.style.display = 'none';

    // Sort docs: register category first, then others
    const sortedDocs = docs.sort((a, b) => {
      const aCategory = a.data().category || '';
      const bCategory = b.data().category || '';
      
      // If one is 'register' and the other isn't, prioritize 'register'
      if (aCategory === 'register' && bCategory !== 'register') return -1;
      if (bCategory === 'register' && aCategory !== 'register') return 1;
      
      // If both are register or both are not register, maintain original order
      return 0;
    });

    sortedDocs.forEach((doc, idx) => {
      const card = makeCard(doc, idx);
      grid.appendChild(card);
    });
  }

  // Search functionality
  function searchPins(searchTerm) {
    if (!searchTerm.trim()) {
      renderList(allPins);
      return;
    }
    
    const filtered = allPins.filter(doc => {
      const data = doc.data();
      const searchLower = searchTerm.toLowerCase();
      return (
        data.url.toLowerCase().includes(searchLower) ||
        (data.note && data.note.toLowerCase().includes(searchLower)) ||
        (data.category && data.category.toLowerCase().includes(searchLower))
      );
    });
    
    renderList(filtered);
  }

  // Function to start the real-time listener
  function startPinsListener() {
    if (unsubscribe) unsubscribe(); // Clean up any existing listener
    
    unsubscribe = pinsCol.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
      const docs = [];
      snapshot.forEach(d => docs.push(d));
      allPins = docs; // Store all pins for search
      
      // Apply current search if active
      if (searchInput.value.trim()) {
        searchPins(searchInput.value);
      } else {
        renderList(docs);
      }
    }, err => {
      console.error('Firestore listener failed', err);
      grid.innerHTML = '<div style="padding:12px;color:#b00">Could not subscribe to updates. Check Firestore rules and console.</div>';
    });
  }

  // Auth state handling
  function showSignedIn(user) {
    console.log('User signed in:', user.email); // Debug log
    
    // Hide the entire auth section when signed in
    authArea.style.display = 'none';
    
    // Show user info in header
    headerUserInfo.style.display = 'flex';
    headerUserEmail.textContent = user.email || user.uid;
    addBtn.disabled = false;
    
    // Start listening to pins when user is signed in
    startPinsListener();
  }

  function showSignedOut() {
    console.log('User signed out'); // Debug log
    
    // Show the auth section when signed out
    authArea.style.display = 'block';
    authForm.style.display = 'flex';
    
    // Hide user info in header
    headerUserInfo.style.display = 'none';
    headerUserEmail.textContent = '';
    addBtn.disabled = true;
    
    // Stop listening and clear pins when user signs out
    if (unsubscribe) unsubscribe();
    grid.innerHTML = '';
    empty.style.display = 'block';
    empty.textContent = 'Please sign in to view shared links';
    allPins = [];
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
    console.log('Sign in button clicked'); // Debug log
    const email = emailInput.value.trim();
    const pw = passwordInput.value;
    console.log('Email:', email, 'Password length:', pw.length); // Debug log
    
    if (!email || !pw) return alert('Provide email and password');
    
    console.log('Attempting to sign in...'); // Debug log
    signInBtn.disabled = true;
    
    auth.signInWithEmailAndPassword(email, pw)
      .then(userCredential => {
        console.log('Sign in successful:', userCredential.user.email); // Debug log
        emailInput.value = '';
        passwordInput.value = '';
      })
      .catch(e => {
        console.error('Sign in error:', e); // Debug log
        alert('Sign in failed: ' + e.message);
      })
      .finally(() => {
        signInBtn.disabled = false;
      });
  });

  registerBtn.addEventListener('click', () => {
    console.log('Register button clicked'); // Debug log
    const email = emailInput.value.trim();
    const pw = passwordInput.value;
    console.log('Email:', email, 'Password length:', pw.length); // Debug log
    
    if (!email || !pw) return alert('Provide email and password to register');
    if (pw.length < 6) return alert('Password must be at least 6 characters');
    
    console.log('Attempting to register...'); // Debug log
    registerBtn.disabled = true;
    
    auth.createUserWithEmailAndPassword(email, pw)
      .then(cred => {
        console.log('Registration successful:', cred.user.email); // Debug log
        const uid = cred.user.uid;
        alert('Registered successfully! Your UID: ' + uid);
        emailInput.value = '';
        passwordInput.value = '';
      })
      .catch(e => {
        console.error('Registration error:', e); // Debug log
        alert('Register failed: ' + e.message);
      })
      .finally(() => {
        registerBtn.disabled = false;
      });
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
    const category = categorySelect.value;
    if (!url) return;
    if (!isValidUrl(url)) {
      alert('Please enter a valid http(s) URL');
      return;
    }

    const title = extractTitleFromUrl(url);
    addBtn.disabled = true;
    pinsCol.add({
      url, 
      note: note || '', 
      title, 
      category: category || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(), 
      ownerUid: user.uid
    }).then(() => {
      urlInput.value = '';
      noteInput.value = '';
      categorySelect.value = '';
      urlInput.focus();
    }).catch(err => {
      console.error('Add failed', err);
      alert('Failed to add pin. See console.');
    }).finally(()=> addBtn.disabled = false);
  });

  // Search functionality event listeners
  searchInput.addEventListener('input', (e) => {
    searchPins(e.target.value);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    renderList(allPins);
    searchInput.focus();
  });

  // allow Enter to submit from URL input
  urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });
  noteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });
});
