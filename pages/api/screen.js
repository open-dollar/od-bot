import fetch from "node-fetch";

export default async function handler(request, response) {
  try {
    // TODO: add domain origin check

    const result = await fetch(
      `https://public.chainalysis.com/api/v1/address/${request.query.address}`,
      {
        headers: {
          "X-API-Key": process.env.CHAINALYSIS_KEY,
          Accept: "application/json",
        },
      }
    );
    return response.send(await result.json());
  } catch (e) {
    console.log(e);
    return response.status(500).json({ success: false, error: e.message });
  }
}
