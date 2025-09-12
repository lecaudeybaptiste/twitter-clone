import { useState, useRef } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Image, Film } from "lucide-react"; // Icônes modernes

export default function TweetBox() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [gifUrl, setGifUrl] = useState("");

  const fileInputRef = useRef(null);

  const handleTweet = async (e) => {
    e.preventDefault();
    if (!user) return alert("Vous devez être connecté pour tweeter.");
    if (!content.trim() && !imageUrl && !gifUrl) return;

    await addDoc(collection(db, "tweets"), {
      content,
      imageUrl,
      gifUrl,
      userId: user.uid,
      email: user.email,
      createdAt: serverTimestamp(),
    });

    // Réinitialiser
    setContent("");
    setImageUrl("");
    setGifUrl("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 👉 Pour simplifier on stocke en base64 (ou sinon tu passes par Firebase Storage plus tard)
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGifClick = () => {
    const url = prompt("Collez l’URL du GIF :");
    if (url) setGifUrl(url);
  };

  return (
    <form
      onSubmit={handleTweet}
      className="p-4 border rounded bg-white shadow-sm mb-6"
    >
      {/* Zone texte */}
      <textarea
        className="w-full border rounded p-2 mb-2"
        placeholder="Quoi de neuf ?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* Prévisualisation si image ou gif ajouté */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="preview"
          className="max-h-48 rounded mb-2 object-cover"
        />
      )}
      {gifUrl && (
        <img
          src={gifUrl}
          alt="gif"
          className="max-h-48 rounded mb-2 object-cover"
        />
      )}

      {/* Icônes d’action */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          {/* Icône Image */}
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="text-black hover:bg-gray-800"
          >
            <Image size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Icône GIF */}
          <button
            type="button"
            onClick={handleGifClick}
            className="text-green-500 hover:text-green-700"
          >
            <Film size={20} />
          </button>
        </div>

        {/* Bouton Publier */}
        <button
          type="submit"
          className="bg-black text-white px-4 py-1 rounded hover:bg-gray-800"
        >
          Publier
        </button>
      </div>
    </form>
  );
}
