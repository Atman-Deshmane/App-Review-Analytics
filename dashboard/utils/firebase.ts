import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off } from 'firebase/database';

// Your web app's Firebase configuration
// For this milestone, we'll assume the user provides these in .env or hardcodes them.
// Ideally, these should come from import.meta.env
const firebaseConfig = {
    // TODO: Replace with actual config or env vars
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DB_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export interface JobStatus {
    status: string;
    progress: number;
    last_update: string;
    result_version?: string; // Added for version control
}

export const subscribeToJob = (jobId: string, callback: (data: JobStatus) => void) => {
    const jobRef = ref(db, `jobs/${jobId}`);

    const unsubscribe = onValue(jobRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        }
    });

    // Return unsubscribe function
    return () => off(jobRef);
};
