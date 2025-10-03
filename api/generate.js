// api/generate.js  (OpenAI 이미지 생성 + 디버그)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  // 0) 필수 키 체크
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "missing OPENAI_API_KEY env" });
  }

  try {
    const { prompt, size = "1024x1024" } = (req.body || {});
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const r = await fetch("https://api.openai.com/v1/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({ model: "gpt-image-1", prompt, size })
    });

    const text = await r.text();                // 원문 유지
    let data;
    try { data = JSON.parse(text); } catch {}   // JSON이면 파싱

    // 1) OpenAI가 에러 주면 그대로 반환해서 원인 확인
    if (!r.ok) return res.status(r.status).send(text || JSON.stringify(data));

    // 2) 정상일 때만 b64 꺼내기
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "no image field in response", raw: data });

    return res.status(200).json({ imageDataUrl: `data:image/png;base64,${b64}` });
  } catch (e) {
    // 3) 스택 그대로 보여주기
    return res.status(500).json({ error: String(e) });
  }
}
