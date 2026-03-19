const SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1yzPnZUgVQ2zYp4PBndyHCXEK6Rj21TV-TbRq9h9GaBc/export?gid=0&format=csv';

export async function onRequestGet() {
  const res = await fetch(SHEETS_CSV_URL);
  const text = await res.text();
  return new Response(text, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
