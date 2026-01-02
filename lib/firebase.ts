import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <--- NUEVO

const firebaseConfig = {
  // ... TUS CLAVES SIGUEN IGUAL AQUÍ ...
  apiKey: "AIzaSyAZbYofqvt-gL2ZRPvjUlmd8fNyhMQXbFY",
  authDomain: "panavencargo.firebaseapp.com",
  projectId: "panavencargo",
  storageBucket: "panavencargo.firebasestorage.app",
  messagingSenderId: "1068216772342",
  appId: "1:1068216772342:web:869b8ec698f200ec1aaed7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // <--- NUEVO: Exportamos la seguridad