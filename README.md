# AI Translation App

## Description

A Next.js translation application that uses AI models (OpenAI GPT-4o-mini and Anthropic Claude Opus 4.5) to translate both text and JSON data between languages. The app features a clean UI with support for multiple languages, JSON file uploads, and preserves JSON structure while translating only string values.

Built with Next.js 16 (App Router), TypeScript, and TailwindCSS.

## Assumptions 

This code translates *all* string JSON values to the target language. 

Also if the source language was chosen incorrectly, the text/JSON values will still be translated to the output language. If the source language and output language are the same, the text/JSON will remain the same.

## How to Run Locally

1. **Clone the repository**
```bash
git clone https://github.com/kkahadze/translation-app
cd translation-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:
```
PROXY_TOKEN=your-proxy-token
OPENAI_BASE_URL=https://hiring-proxy.gtx.dev/openai
ANTHROPIC_BASE_URL=https://hiring-proxy.gtx.dev/anthropic
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open the app**

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.


## Challenges

One major challenge I faced was getting the LM to translate *all* JSON string values to the other language, even some that a user might traditionally not want to translate, such as filenames and URLS. 

## Improvements

With more time, I would implement different useful features:
- an ability to choose not to translate certain JSON string values such as type names, file paths, urls, etc.
- more models and providers
- a token counter or approximator so the user does not go over the max tokens / context length
- the ability to put in an unlimited amount of input, with the site processing input in chunks
- the ability to translate other useful filetypes
- a cleaner UI