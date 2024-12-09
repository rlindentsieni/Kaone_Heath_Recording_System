//"type=module";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCVahDbnhpzA7SeV5pww0b4aqPceqDaYeQ",
  authDomain: "test-api-748de.firebaseapp.com",
  projectId: "test-api-748de",
  storageBucket: "test-api-748de.firebasestorage.app",
  messagingSenderId: "1030588865376",
  appId: "1:1030588865376:web:cb360255670ae09857dc05",
  measurementId: "G-5GJPGBQQL9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
export { db, auth, storage };

// get form
document
  .getElementById("createFileForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // prevent form from submitting normally

    // get form data
    var formData = new FormData(event.target);

    alert(formData);
  });
