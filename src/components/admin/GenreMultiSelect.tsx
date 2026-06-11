'use client';

const DRAMA_GENRE_OPTIONS = [
  { code: 'urban', name: '都市' },
  { code: 'romance', name: '爱情' },
  { code: 'suspense', name: '悬疑' },
  { code: 'costume', name: '古装' },
  { code: 'comedy', name: '喜剧' },
  { code: 'xianxia', name: '仙侠' },
  { code: 'war', name: '战争' },
  { code: 'thriller', name: '惊悚' },
];

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
      {DRAMA_GENRE_OPTIONS.map((genre) => {
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
