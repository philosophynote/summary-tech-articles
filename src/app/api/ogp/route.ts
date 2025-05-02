import { NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const url = searchParams.get('url');
  if (!url) {
    return NextResponse.json({ ogpImageUrl: null }, { status: 400 });
  }
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = load(data);
    // OGP画像のmetaタグを探す
    const ogpImageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="og:image"]').attr('content') ||
      $('meta[property="twitter:image"]').attr('content') ||
      null;
    return NextResponse.json({ ogpImageUrl });
  } catch (e) {
    return NextResponse.json({ ogpImageUrl: null }, { status: 500 });
  }
} 