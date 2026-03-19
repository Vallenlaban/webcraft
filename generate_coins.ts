import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateCoinImages() {
  const prompts = [
    { id: "coins_50", prompt: "A single shiny blue 3D game coin with 'EP' text embossed, high quality, isometric view, isolated on white background" },
    { id: "coins_120", prompt: "A small stack of three shiny blue 3D game coins with 'EP' text embossed, high quality, isometric view, isolated on white background" },
    { id: "coins_260", prompt: "A stack of five shiny blue 3D game coins with 'EP' text embossed, high quality, isometric view, isolated on white background" },
    { id: "coins_550", prompt: "A small pile of shiny blue 3D game coins with 'EP' text embossed, high quality, isometric view, isolated on white background" },
    { id: "coins_1200", prompt: "A medium pile of shiny blue 3D game coins with 'EP' text embossed, high quality, isometric view, isolated on white background" },
    { id: "coins_2500", prompt: "A large pile of shiny blue 3D game coins with 'EP' text embossed, high quality, isometric view, isolated on white background" },
    { id: "coins_5500", prompt: "A huge overflowing treasure of shiny blue 3D game coins with 'EP' text embossed, high quality, isometric view, isolated on white background" }
  ];

  const results = [];
  for (const p of prompts) {
    console.log(`Generating ${p.id}...`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: p.prompt }] },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        results.push({ id: p.id, data: `data:image/png;base64,${part.inlineData.data}` });
      }
    }
  }
  
  console.log(JSON.stringify(results));
}

generateCoinImages();
