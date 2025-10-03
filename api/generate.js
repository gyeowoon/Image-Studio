// api/generate.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { prompt, size = "1024x1024" } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    // ✅ Google Image Generation API
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/imagegeneration:generate?key=" +
      process.env.GEMINI_API_KEY;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        size // 예: "1024x1024"
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    // 응답에서 base64 이미지 꺼내기
    const b64 =
      data?.images?.[0]?.base64 ||
      data?.generatedImages?.[0]?.image?.base64 ||
      data?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;

    if (!b64) return res.status(500).json({ error: "no image in response", raw: data });

    return res.status(200).json({ imageDataUrl: `data:image/png;base64,${b64}` });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
