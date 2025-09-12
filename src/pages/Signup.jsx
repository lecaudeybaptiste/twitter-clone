import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Création du compte Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // On s'assure que le pseudo commence par "@"
      const finalPseudo = pseudo.startsWith("@")
        ? pseudo
        : "@" + pseudo.replace(/^@+/, "");

      // Création du document Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        pseudo: finalPseudo,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${finalPseudo || email}`,
        createdAt: serverTimestamp(),
      });

      // Redirection vers profil
      navigate(`/profile/${user.uid}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Créer un compte</h1>
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {/* Champ pseudo avec @ obligatoire */}
        <input
          type="text"
          placeholder="Pseudo"
          className="border p-2 rounded"
          value={pseudo}
          onChange={(e) => {
            let val = e.target.value;
            if (!val.startsWith("@")) {
              val = "@" + val.replace(/^@+/, ""); // Force toujours @ au début
            }
            setPseudo(val);
          }}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-black text-white py-2 rounded hover:bg-gray-800 transition"
        >
          S’inscrire
        </button>
      </form>
    </div>
  );
}
