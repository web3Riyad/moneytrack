/**
 * firebase-config.js
 * ------------------
 * Initialises the Firebase app and exports the services we use:
 *   - firebase.auth()      → handles login / logout / session
 *   - firebase.firestore() → cloud database
 *
 * WHY the API key is safe to be public:
 *   Firebase web API keys are NOT secret. They only identify your project.
 *   Security is enforced by:
 *     1. Firestore Security Rules (you set these in the Firebase console)
 *     2. Firebase Authentication (only logged-in users can write data)
 *   Anyone who gets this key can still only access data that the
 *   security rules allow — which is nothing without being logged in.
 *
 * In Phase 3 we move this to environment variables (.env) as best practice.
 */

const firebaseConfig = {
  apiKey:            "AIzaSyB_B6OSdhz9TH22Iiv56J1xA1ze1Ydd__o",
  authDomain:        "moneytrack-dc210.firebaseapp.com",
  projectId:         "moneytrack-dc210",
  storageBucket:     "moneytrack-dc210.firebasestorage.app",
  messagingSenderId: "612980577415",
  appId:             "1:612980577415:web:171e42cf35ee0828835422",
};

// Initialise Firebase — guard prevents "already exists" error if script loads twice
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

/**
 * Auth service — used for login, register, Google sign-in, sign-out.
 * Accessed anywhere as: FirebaseAuth
 */
const FirebaseAuth = firebase.auth();

/**
 * Firestore service — used for reading and writing entries.
 * Accessed anywhere as: FirebaseDB
 */
const FirebaseDB = firebase.firestore();

/**
 * Google Auth Provider — used for "Continue with Google" button.
 */
const GoogleProvider = new firebase.auth.GoogleAuthProvider();
