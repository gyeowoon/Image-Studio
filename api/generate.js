// api/generate.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt, ratio } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" +
      process.env.GEMINI_API_KEY;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${prompt} | ratio:${ratio || "1:1"}` }],
          },
        ],
      }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
