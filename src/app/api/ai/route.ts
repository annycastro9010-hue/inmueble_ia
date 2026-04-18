import { NextResponse } from 'next/server';
import { processPropertyImage } from '@/lib/ai-stager'; // Updated for Google AI Studio

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageUrl, roomType, mode } = body;

    if (!imageUrl || !mode) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const prediction = await processPropertyImage({
      imageUrl,
      roomType: roomType || 'room',
      mode
    });

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('AI Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
