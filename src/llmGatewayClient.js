const https = require('https');
const {URL} = require('url');

/* global Promise */

class LlmGatewayClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.llmgateway.io';
  }

  async generateSemanticTitle(currentTitle, description) {
    const prompt = `Given this pull request title: "${currentTitle}" and description: "${
      description || 'No description provided'
    }", generate a semantic commit title following the Conventional Commits specification (https://www.conventionalcommits.org/). The title should be maximum 50 characters and follow the format: type(scope): subject. Common types include: feat, fix, docs, style, refactor, test, chore. Return only the semantic title, nothing else.`;

    const requestBody = JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 60,
      temperature: 0.3
    });

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
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);

            if (res.statusCode !== 200) {
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
        reject(new Error(`LLM Gateway API request failed: ${error.message}`));
      });

      req.write(requestBody);
      req.end();
    });
  }
}

module.exports = LlmGatewayClient;
