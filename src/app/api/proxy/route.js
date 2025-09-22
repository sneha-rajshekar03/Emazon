export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).end();
    }

    const contentType = response.headers.get("content-type");
    res.setHeader("Content-Type", contentType);

    // Convert the response to a buffer and send it
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch image" });
  }
}
