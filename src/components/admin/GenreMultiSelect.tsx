'use client';

import { DRAMA_GENRES } from '@/lib/admin/drama-genres';

interface GenreMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function GenreMultiSelect({ value, onChange }: GenreMultiSelectProps) {
  function toggle(code: string) {
    if (value.includes(code)) {
      onChange(value.filter((item) => item !== code));
      return;
    }

    onChange([...value, code]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DRAMA_GENRES.map((genre) => {
        const selected = value.includes(genre.code);
        return (
          <button
            key={genre.code}
            type="button"
            onClick={() => toggle(genre.code)}
            className={`rounded-md border px-3 py-2 text-sm ${
              selected ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
}
