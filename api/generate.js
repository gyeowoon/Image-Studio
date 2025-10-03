// api/generate.js  (OpenAI 이미지 생성)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { prompt, size = "1024x1024" } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const r = await fetch("https://api.openai.com/v1/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size // "1024x1024", "1024x1792", "1792x1024"
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "no image in response", raw: data });

    return res.status(200).json({ imageDataUrl: `data:image/png;base64,${b64}` });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
