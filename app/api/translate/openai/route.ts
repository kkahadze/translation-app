// app/api/translate/openai/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TranslationRequest, TranslationResponse, ErrorResponse } from '../../types';

const openai = new OpenAI({
  apiKey: process.env.PROXY_TOKEN!,
  baseURL: process.env.OPENAI_BASE_URL!,
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

    let prompt = `Translate the following text to ${targetLang}.

The user indicated the input language is ${sourceLang}, but:
- If the text is already in ${targetLang}, return it unchanged
- If the text is in a different language than ${sourceLang}, still translate it to ${targetLang}
`;
    
    if (isJson) {
      prompt += `\nThe input is JSON. You MUST translate ALL string values to ${targetLang}, keeping all keys unchanged. This includes:
- Regular text and sentences
- String values that look like types (e.g., "playground", "chat-multiple")
- String values that look like enums or constants
- Single word strings
- Filenames, URLs, file paths, etc, if its a string value: Translate it!
DO NOT skip ANY string value, even if it looks like it will break something if it is translated or if it looks like it shouldn't be translated; ALL string values should be translated (Ex. {"type" : "carType.ENUM"} -> {"type" : "carroTipo.ENUM"})

Preserve the exact JSON structure. Return only valid JSON, no explanations. IMPORTANT: Properly escape all special characters in JSON strings (quotes as \\", backslashes as \\\\, newlines as \\n). Don't forget to translate ALL string values, EVEN if they look like they shouldn't be translated (filemames, urls, etc); if its a string value: Translate it!

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

Now translate ALL string values to ${targetLang}:`;
    } else {
      prompt += `\nReturn only the translated text, no explanations.`;
    }
    
    prompt += `\n\nText to translate:\n${text}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      ...(isJson && { response_format: { type: 'json_object' } }),
    });

    // Check if response was cut off due to token limit
    if (completion.choices[0]?.finish_reason === 'length') {
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Translation too long',
          details: 'Your input is too large to translate in one request. Try using smaller text or breaking it into parts.'
        },
        { status: 413 }  // 413 = Payload Too Large
      );
    }

    const translatedText = completion.choices[0]?.message?.content?.trim() || '';
    
    if (!translatedText) {
      return NextResponse.json<ErrorResponse>(
        { error: 'No translation received from OpenAI' },
        { status: 500 }
      );
    }

    // NEW: Validate JSON if this was a JSON translation
    if (isJson) {
      try {
        JSON.parse(translatedText);
      } catch (parseError) {
        return NextResponse.json<ErrorResponse>(
          { 
            error: 'Translation produced invalid JSON',
            details: 'The AI returned malformed JSON. Please try again.'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json<TranslationResponse>({
      translatedText,
      provider: 'openai',
      model: 'gpt-4o-mini',
    });

  } catch (error) {
    console.error('OpenAI translation error:', error);
    
    return NextResponse.json<ErrorResponse>(
      { 
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}