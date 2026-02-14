"use client";

interface TextEntryFormProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TextEntryForm({ value, onChange }: TextEntryFormProps) {
  return (
    <div>
      <label
        htmlFor="text-content"
        className="block text-sm font-medium text-stone-700"
      >
        Journal Entry
      </label>
      <textarea
        id="text-content"
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your thoughts..."
        className="mt-1 block w-full rounded-md border border-sand bg-ivory px-3 py-2 text-ink shadow-[var(--shadow-warm-sm)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
  );
}
