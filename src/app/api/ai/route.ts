import { NextResponse } from 'next/server';
import { processPropertyImage } from '@/lib/ai-stager';



export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.imageUrl) {
      return NextResponse.json({ error: 'Falta la URL de la imagen' }, { status: 400 });
    }

    // El proceso ahora es directo con Gemini 3.1 Flash Image
    const result = await processPropertyImage(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
