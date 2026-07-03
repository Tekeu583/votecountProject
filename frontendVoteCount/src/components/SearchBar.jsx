// src/components/SearchBar.jsx
import { Search } from 'lucide-react';
import TextInput from './ui/TextInput';
import { useState } from 'react';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <div className="max-w-3xl mx-auto px-6 relative z-10">
      <div className="bg-white rounded-xl shadow-2xl p-2 flex items-center">
        <div className="flex-1 flex items-center gap-3 px-6">
          <TextInput
            type="text"
            name="search"
            id="search"
            autoComplete="off"
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Rechercher un candidat, une ville ou un enjeu..."
            placeholder="Rechercher un candidat, une ville ou un enjeu..."
            iconLeft={Search}
            className="flex-1 bg-transparent outline-none text-lg text-black placeholder:text-gray-400"
          />
        </div>
        <button className="bg-[#0A1428] text-white px-10 py-4 rounded-xl font-semibold hover:bg-[var(--color-primary)] transition">
          Rechercher
        </button>
      </div>
    </div>
  );
}