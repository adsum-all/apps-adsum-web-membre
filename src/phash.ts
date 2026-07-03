// Perceptual difference hash (dHash) computed in the browser, no dependency.
// The image is reduced to 9x8 grayscale; each row yields 8 bits by comparing
// adjacent pixels. The 64 bits are returned as a 16-character hex string, which
// the server compares by Hamming distance for the duplicate-detection photo
// signal. Returns null if the image cannot be decoded.

const W = 9;
const H = 8;

export async function computePhash(file: File): Promise<string | null> {
  try {
    const bitmap = await loadBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, W, H);
    const { data } = ctx.getImageData(0, 0, W, H);

    const gray: number[] = [];
    for (let i = 0; i < W * H; i++) {
      const r = data[i * 4] ?? 0;
      const g = data[i * 4 + 1] ?? 0;
      const b = data[i * 4 + 2] ?? 0;
      gray.push(0.299 * r + 0.587 * g + 0.114 * b);
    }

    let bits = "";
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W - 1; x++) {
        const left = gray[y * W + x] ?? 0;
        const right = gray[y * W + x + 1] ?? 0;
        bits += left < right ? "1" : "0";
      }
    }
    return bitsToHex(bits);
  } catch {
    return null;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode failed"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function bitsToHex(bits: string): string {
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}
