export interface ChatOption {
  name: string;
  url: string;
  token: string;
  model: string;
  temperature: number;
  max_tokens: number;
  messages: { role: string; content: string | ({ type: string; text?: string; image_url?: { url: string } })[] }[];
  stream: boolean;
  renderMarkdown: boolean;
  prompt: string;
}