import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { TranslationRequest, TranslationResponse, ErrorResponse } from '../../types';

const anthropic = new Anthropic({
  apiKey: process.env.PROXY_TOKEN!,
  baseURL: process.env.ANTHROPIC_BASE_URL!,
});

export async function POST(request: NextRequest) {
  try {
    const body: TranslationRequest = await request.json();
    const { text, sourceLang, targetLang, isJson } = body;
    
    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Missing required fields: text, sourceLang, or targetLang' },
        { status: 400 }
      );
    }

    let prompt: string;
    
    if (isJson) {
      try {
        JSON.parse(text);
      } catch (e) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Invalid JSON input' },
          { status: 400 }
        );
      }
      
      prompt = `You are a precise JSON translator. Your task is to translate ALL string values in JSON to ${targetLang}.

The user indicated the input language is ${sourceLang}, but:
- If the text is already in ${targetLang}, return it unchanged
- If the text is in a different language than ${sourceLang}, still translate it to ${targetLang}

CRITICAL RULES:
1. Return ONLY valid JSON - no explanations, no markdown, no code blocks
2. Translate ALL string values to ${targetLang} - this includes:
   - Regular text and sentences
   - String values that look like types
   - String values that look like enums or constants
   - Single word strings
   - DO NOT skip ANY string value, even if it looks like it will break something if it is translated or if it looks like it shouldn't be translated; ALL string values should be translated (Ex. {"type" : "carType.ENUM"} -> {"type" : "carroTipo.ENUM"})
3. Keep ALL keys in their original form (do NOT translate keys)
4. Preserve exact structure, data types, and nesting
5. Keep numbers, booleans, and null values unchanged
6. Do not add or remove any fields
7. IMPORTANT: Properly escape special characters in JSON strings:
   - Escape double quotes as \\"
   - Escape backslashes as \\\\
   - Escape newlines as \\n
   - Keep all JSON syntax valid 

Don't forget to translate ALL string values, EVEN if they look like they shouldn't be translated (filemames, urls, etc); if its a string value: Translate it!

EXAMPLES of what you MUST do (using Spanish as example):
❌ WRONG: {"type": "playground"} 
✅ CORRECT: {"type": "patio de recreo"}

❌ WRONG: {"filename": "video_8.mp4"}
✅ CORRECT: {"filename": "video_8.mp4"} (keep extension) OR {"filename": "vídeo_8.mp4"} (translate if word is translatable)

❌ WRONG: {"type": "ai-generated"}
✅ CORRECT: {"type": "generado-por-ia"}

❌ WRONG: {"action": "chat-multiple"}
✅ CORRECT: {"action": "chat-múltiple"}

❌ WRONG: {"image": "introImage"}
✅ CORRECT: {"image": "imagenIntro"}

Now translate ALL string values in this JSON to ${targetLang}:
${text}

Output JSON:`;
    } else {
      prompt = `Translate the following text to ${targetLang}. Return only the translated text, no explanations.

The user indicated the input language is ${sourceLang}, but:
- If the text is already in ${targetLang}, return it unchanged
- If the text is in a different language than ${sourceLang}, still translate it to ${targetLang}

Text to translate:
${text}`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 16384,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    // Check if response was cut off due to token limit
    if (message.stop_reason === 'max_tokens') {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Translation too long',
          details: 'Your input is too large to translate in one request. Try using smaller text or breaking it into parts.'
        },
        { status: 413 }  // 413 = Payload Too Large
      );
    }

    let translatedText = message.content[0]?.type === 'text' 
      ? message.content[0].text.trim() 
      : '';
    
    if (!translatedText) {
      return NextResponse.json<ErrorResponse>(
        { error: 'No translation received from Anthropic' },
        { status: 500 }
      );
    }

    if (isJson) {
      const codeBlockMatch = translatedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        translatedText = codeBlockMatch[1].trim();
      }
      
      try {
        JSON.parse(translatedText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Received text:', translatedText.substring(0, 500));
        
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Translation produced invalid JSON',
            details: 'The AI returned malformed JSON. Please try with OpenAI provider or a smaller JSON.'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json<TranslationResponse>({
      translatedText,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

  } catch (error) {
    console.error('Anthropic translation error:', error);
    
    return NextResponse.json<ErrorResponse>(
      { 
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}