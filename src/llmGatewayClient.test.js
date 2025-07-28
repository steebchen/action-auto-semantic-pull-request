const LlmGatewayClient = require('./llmGatewayClient');

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

  const client = new LlmGatewayClient('test-api-key');
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

  const client = new LlmGatewayClient('invalid-api-key');

  await expect(
    client.generateSemanticTitle('Add feature', 'Description')
  ).rejects.toThrow('LLM Gateway API error: API key invalid');
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

  const client = new LlmGatewayClient('test-api-key');

  await expect(
    client.generateSemanticTitle('Add feature', 'Description')
  ).rejects.toThrow('No content received from LLM Gateway API');
});
