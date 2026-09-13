import { NextRequest, NextResponse } from 'next/server';
import { getQuoteById, toPublicQuote } from '@/lib/db';
import { seedDemoQuote } from '@/lib/seed';

seedDemoQuote();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || typeof id !== 'string' || id.length < 10) {
      return NextResponse.json(
        { error: '未找到报价单' },
        { status: 404 }
      );
    }

    const quote = getQuoteById(id);
    
    if (!quote) {
      return NextResponse.json(
        { error: '未找到报价单' },
        { status: 404 }
      );
    }

    return NextResponse.json(toPublicQuote(quote));
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}
