// api/ping.js
export default function handler(req, res) {
  const ok = !!process.env.OPENAI_API_KEY;
  res.status(200).json({ openai_key_present: ok });
}
