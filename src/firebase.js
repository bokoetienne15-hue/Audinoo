import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCGMhGs0sXgnd4Frv7TZL8dJnn2hAPskYk',
  authDomain: 'audinoo.firebaseapp.com',
  projectId: 'audinoo',
  storageBucket: 'audinoo.firebasestorage.app',
  messagingSenderId: '1077971976935',
  appId: '1:1077971976935:web:19cbb0276b4a35213d5842',
  measurementId: 'G-0MPK845WL3'
}

const firebaseApp = initializeApp(firebaseConfig)
const auth = getAuth(firebaseApp)
const db = getFirestore(firebaseApp)
const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({ prompt: 'select_account' })

export { auth, db, googleProvider }
