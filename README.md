# Ask Naval Lens

Ask Naval Lens is an independent bilingual analysis tool built around ideas Naval Ravikant has shared publicly. It helps users examine a real decision, connect it with relevant mental models, understand why those ideas apply, and turn the analysis into concrete next steps.

This project does not impersonate Naval Ravikant and is not affiliated with or endorsed by him.

## Product scope

- Chinese and English interfaces
- Topic-guided question analysis
- Structured AI output with verifiable public sources
- Three free analyses per week for anonymous visitors
- Shareable analysis pages
- Optional ChatGPT sign-in for the English experience
- Basic quota, feedback, and product analytics

## Local development

Requirements:

- Node.js 22.13 or newer
- A DeepSeek API key

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open:

- Chinese: `http://localhost:3000/zh`
- English: `http://localhost:3000/en`

Set `DEEPSEEK_API_KEY` in `.env.local`. Never commit `.env.local` or an API key.

## Useful commands

```bash
npm run lint
npm run build
npm run test:quality
```

## Deployment

The current project is configured for OpenAI Sites. Runtime secrets such as `DEEPSEEK_API_KEY` and optional Stripe credentials must be configured in the hosting environment rather than committed to the repository.

## Disclaimer

Outputs are generated as an independent thinking aid from public ideas and reviewed sources. They do not represent Naval Ravikant and are not medical, legal, investment, or other professional advice.
