const AiClient = require('./ai-client');

const mockHttpsRequest = jest.fn();
const mockHttpsResponse = {
  on: jest.fn(),
  statusCode: 200
};

jest.mock('https', () => ({
  request: (...args) => mockHttpsRequest(...args)
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockHttpsRequest.mockReturnValue({
    on: jest.fn(),
    write: jest.fn(),
    end: jest.fn()
  });
});

it('generates semantic title successfully', async () => {
  const mockResponse = {
    choices: [
      {
        message: {
          content: 'feat: Add user authentication'
        }
      }
    ]
  };

  mockHttpsRequest.mockImplementation((options, callback) => {
    const req = {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn()
    };

    setTimeout(() => {
      callback(mockHttpsResponse);
      const dataCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'data'
      )[1];
      const endCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'end'
      )[1];

      dataCallback(JSON.stringify(mockResponse));
      endCallback();
    }, 0);

    return req;
  });

  const client = new AiClient('test-api-key');
  const result = await client.generateSemanticTitle(
    'Add login feature',
    'This PR adds user login functionality'
  );

  expect(result).toBe('feat: Add user authentication');
});

it('throws error when API returns error status', async () => {
  const mockErrorResponse = {
    error: {
      message: 'API key invalid'
    }
  };

  mockHttpsResponse.statusCode = 401;

  mockHttpsRequest.mockImplementation((options, callback) => {
    const req = {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn()
    };

    setTimeout(() => {
      callback(mockHttpsResponse);
      const dataCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'data'
      )[1];
      const endCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'end'
      )[1];

      dataCallback(JSON.stringify(mockErrorResponse));
      endCallback();
    }, 0);

    return req;
  });

  const client = new AiClient('invalid-api-key');

  await expect(
    client.generateSemanticTitle('Add feature', 'Description')
  ).rejects.toThrow('AI API error: API key invalid');
});

it('throws error when no content is received', async () => {
  const mockResponse = {
    choices: []
  };

  mockHttpsResponse.statusCode = 200;

  mockHttpsRequest.mockImplementation((options, callback) => {
    const req = {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn()
    };

    setTimeout(() => {
      callback(mockHttpsResponse);
      const dataCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'data'
      )[1];
      const endCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'end'
      )[1];

      dataCallback(JSON.stringify(mockResponse));
      endCallback();
    }, 0);

    return req;
  });

  const client = new AiClient('test-api-key');

  await expect(
    client.generateSemanticTitle('Add feature', 'Description')
  ).rejects.toThrow('No content received from AI API');
});

it('accepts custom base URL', async () => {
  const mockResponse = {
    choices: [
      {
        message: {
          content: 'feat: Add custom API'
        }
      }
    ]
  };

  mockHttpsRequest.mockImplementation((options, callback) => {
    // Check that the custom base URL is used
    expect(options.hostname).toBe('api.custom.com');

    const req = {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn()
    };

    setTimeout(() => {
      callback(mockHttpsResponse);
      const dataCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'data'
      )[1];
      const endCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'end'
      )[1];

      dataCallback(JSON.stringify(mockResponse));
      endCallback();
    }, 0);

    return req;
  });

  const client = new AiClient(
    'test-api-key',
    'owner/repo',
    'https://api.custom.com'
  );
  const result = await client.generateSemanticTitle(
    'Add custom API',
    'This PR adds custom API functionality'
  );

  expect(result).toBe('feat: Add custom API');
});

it('uses llama-3.3-70b-instruct-free as default model', async () => {
  const mockResponse = {
    choices: [
      {
        message: {
          content: 'feat: Add llama feature'
        }
      }
    ]
  };

  let requestBodyParsed;
  mockHttpsRequest.mockImplementation((options, callback) => {
    const req = {
      on: jest.fn(),
      write: jest.fn((body) => {
        requestBodyParsed = JSON.parse(body);
      }),
      end: jest.fn()
    };

    setTimeout(() => {
      callback(mockHttpsResponse);
      const dataCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'data'
      )[1];
      const endCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'end'
      )[1];

      dataCallback(JSON.stringify(mockResponse));
      endCallback();
    }, 0);

    return req;
  });

  const client = new AiClient('test-api-key');
  await client.generateSemanticTitle('Add feature', 'Description');

  expect(requestBodyParsed.model).toBe('llama-3.3-70b-instruct-free');
});

it('uses custom model when specified', async () => {
  const mockResponse = {
    choices: [
      {
        message: {
          content: 'feat: Add custom model feature'
        }
      }
    ]
  };

  let requestBodyParsed;
  mockHttpsRequest.mockImplementation((options, callback) => {
    const req = {
      on: jest.fn(),
      write: jest.fn((body) => {
        requestBodyParsed = JSON.parse(body);
      }),
      end: jest.fn()
    };

    setTimeout(() => {
      callback(mockHttpsResponse);
      const dataCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'data'
      )[1];
      const endCallback = mockHttpsResponse.on.mock.calls.find(
        (call) => call[0] === 'end'
      )[1];

      dataCallback(JSON.stringify(mockResponse));
      endCallback();
    }, 0);

    return req;
  });

  const client = new AiClient(
    'test-api-key',
    'owner/repo',
    'https://api.llmgateway.io',
    'gpt-4o-mini'
  );
  await client.generateSemanticTitle('Add feature', 'Description');

  expect(requestBodyParsed.model).toBe('gpt-4o-mini');
});
