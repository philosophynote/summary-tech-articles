"use client";

import React, { useState } from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import Image from 'next/image';

// OGP画像URLを取得する関数
async function fetchOgpImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/ogp?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    return data.ogpImageUrl || null;
  } catch {
    return null;
  }
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ title: string; summary: string; link: string; ogpImageUrl?: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      // OGP画像を並列取得
      const itemsWithOgp = await Promise.all(
        (data.results || []).map(async (item: any) => {
          const ogpImageUrl = await fetchOgpImage(item.link);
          return { ...item, ogpImageUrl };
        })
      );
      setResults(itemsWithOgp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <Input
          placeholder="検索ワードを入力"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={loading || !query}>
          {loading ? '検索中…' : '検索'}
        </Button>
      </form>
      <div className="grid gap-4">
        {results.map((item, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              {item.ogpImageUrl && (
                <div className="mb-2">
                  <Image
                    src={item.ogpImageUrl}
                    alt={item.title}
                    width={600}
                    height={315}
                    className="rounded w-full h-auto object-cover"
                    style={{ maxHeight: 200 }}
                  />
                </div>
              )}
              <CardTitle>
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent>{item.summary}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
