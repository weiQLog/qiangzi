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

  function removeBase64Prefix(base64String: string): string {
    // 使用正则表达式去除前缀
    return base64String.replace(/^data:image\/[a-z]+;base64,/, '');
}
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
        const msg = await provider.messages.create({
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
                      "data": removeBase64Prefix(imageBase64)
                    }
                  }
                ]
              }
            ]
          });
        console.log(`claudeai: `, msg);
        if(msg.content.length > 0) {
          let text = msg.content[0].type === "text" ? msg.content[0].text : ""
          console.log(`claudeai: `, text);
          return text;
        }
        return "";
      }
      return "";
    });
  };
  