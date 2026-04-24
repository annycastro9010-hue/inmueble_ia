import { NextResponse } from 'next/server';
import { processPropertyImage } from '@/lib/ai-stager';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Aumentar límite para manejar imágenes base64 si es necesario
    },
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validar que tengamos una URL
    if (!body.imageUrl) {
      return NextResponse.json({ error: 'Falta la URL de la imagen' }, { status: 400 });
    }

    const result = await processPropertyImage(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const replicateKey = process.env.REPLICATE_API_TOKEN;

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { "Authorization": `Token ${replicateKey}` }
    });
    const prediction = await response.json();
    
    return NextResponse.json({
      status: prediction.status,
      outputUrl: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output,
      error: prediction.error
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
