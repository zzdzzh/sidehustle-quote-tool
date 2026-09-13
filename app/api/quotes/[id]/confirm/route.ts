import { NextRequest, NextResponse } from 'next/server';
import { getQuoteById, confirmQuote } from '@/lib/db';
import { checkRateLimit, getRateLimitKey, getClientIp } from '@/lib/rate-limit';
import { validateOrigin, createErrorResponse } from '@/lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid request', 403);
    }

    const clientIp = getClientIp(request);
    const rateLimitKey = getRateLimitKey(clientIp, id);
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
          }
        }
      );
    }

    if (!id || typeof id !== 'string' || id.length < 10) {
      return createErrorResponse('Invalid quote ID', 404);
    }

    const quote = getQuoteById(id);
    if (!quote) {
      return createErrorResponse('Quote not found', 404);
    }

    if (quote.status === 'confirmed') {
      return NextResponse.json({
        success: true,
        message: '报价单已确认',
        confirmedAt: quote.confirmed_at
      });
    }

    const success = confirmQuote(id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: '报价单确认成功'
      });
    } else {
      return createErrorResponse('Confirmation failed', 500);
    }
  } catch (error) {
    console.error('Error confirming quote:', error);
    return createErrorResponse('Operation failed', 500);
  }
}

export async function GET() {
  return NextResponse.json(
    { error: '方法不允许' },
    { status: 405 }
  );
}
