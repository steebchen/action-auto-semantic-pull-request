const https = require('https');
const {URL} = require('url');

/* global Promise */

class LlmGatewayClient {
  constructor(apiKey, repositorySlug) {
    this.apiKey = apiKey;
    this.repositorySlug = repositorySlug;
    this.baseUrl = 'https://api.llmgateway.io';
  }

  async generateSemanticTitle(currentTitle, description) {
    const prompt = `Given this pull request title: "${currentTitle}" and description: "${
      description || 'No description provided'
    }", generate a semantic commit title following the Conventional Commits specification (https://www.conventionalcommits.org/). The title should be maximum 50 characters and follow the format: type(scope): subject. Common types include: feat, fix, docs, style, refactor, test, chore. Return only the semantic title, nothing else.`;

    const requestBody = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 60,
      temperature: 0.3
    });

    console.log(`[LLM Gateway] Making request to ${this.baseUrl}/v1/chat/completions`);
    console.log(`[LLM Gateway] Repository: ${this.repositorySlug}`);
    console.log(`[LLM Gateway] Request body:`, requestBody);

    return new Promise((resolve, reject) => {
      const url = new URL('/v1/chat/completions', this.baseUrl);

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody),
          'x-llmgateway-kind': 'auto-pr',
          'x-llmgateway-repo': this.repositorySlug
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log(`[LLM Gateway] Response status: ${res.statusCode}`);
          console.log(`[LLM Gateway] Response data:`, data);

          try {
            const response = JSON.parse(data);

            if (res.statusCode !== 200) {
              console.log(`[LLM Gateway] API error:`, response.error);
              reject(
                new Error(
                  `LLM Gateway API error: ${
                    response.error?.message || 'Unknown error'
                  }`
                )
              );
              return;
            }

            const generatedTitle =
              response.choices?.[0]?.message?.content?.trim();
            console.log(`[LLM Gateway] Generated title: "${generatedTitle}"`);

            if (!generatedTitle) {
              reject(new Error('No content received from LLM Gateway API'));
              return;
            }

            resolve(generatedTitle);
          } catch (error) {
            reject(
              new Error(
                `Failed to parse LLM Gateway API response: ${error.message}`
              )
            );
          }
        });
      });

      req.on('error', (error) => {
        console.log(`[LLM Gateway] Request error:`, error);
        reject(new Error(`LLM Gateway API request failed: ${error.message}`));
      });

      req.write(requestBody);
      req.end();
    });
  }
}

module.exports = LlmGatewayClient;
