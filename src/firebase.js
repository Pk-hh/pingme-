import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAkJMSmXheajugDB_i_FqTj-6zqvJV4OSw",
    authDomain: "my-whatsapp-288f8.firebaseapp.com",
    projectId: "my-whatsapp-288f8",
    storageBucket: "my-whatsapp-288f8.firebasestorage.app",
    messagingSenderId: "190803272564",
    appId: "1:190803272564:web:baf9b4a4613312b8c20221"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
// Ensure persistence is set to local (survives browser restart)
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Firebase persistence error:", error);
});
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, db, provider };
