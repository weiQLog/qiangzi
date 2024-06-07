import Anthropic from "@anthropic-ai/sdk";
import { kv } from '@vercel/kv';
import { Ratelimit } from '@upstash/ratelimit';
import { AI_TEXT_GENERATION_ENABLED, HAS_VERCEL_KV } from '@/site/config';
import { safelyRunAdminServerAction } from '@/auth';

const RATE_LIMIT_IDENTIFIER = 'openai-image-query';
const RATE_LIMIT_MAX_QUERIES_PER_HOUR = 100;

const provider = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // defaults to process.env["ANTHROPIC_API_KEY"]
  });
// 速率限制 Allows 100 requests per hour
const ratelimit = HAS_VERCEL_KV
  ? new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_QUERIES_PER_HOUR, '1h'),
  })
  : undefined;

export const streamClaudeAiImageQuery = async (
    imageBase64: string,
    query: string,
  ) => {
    return safelyRunAdminServerAction(async () => {
      if (ratelimit) {
        let success = false;
        try {
          success = (await ratelimit.limit(RATE_LIMIT_IDENTIFIER)).success;
        } catch (e: any) {
          console.error('Failed to rate limit OpenAI', e);
          throw new Error('Failed to rate limit OpenAI');
        }
        if (!success) {
          console.error('OpenAI rate limit exceeded');
          throw new Error('OpenAI rate limit exceeded');
        }
      }
  
      if (provider) {
        console.log(`provider.messages.create`);
        return await provider.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 1000,
            temperature: 0,
            system: query,
            messages: [
              {
                "role": "user",
                "content": [
                  {
                    "type": "image",
                    "source": {
                      "type": "base64",
                      "media_type": "image/jpeg",
                      "data": imageBase64
                    }
                  }
                ]
              }
            ]
          });
      }
      return "";
    });
  };
  