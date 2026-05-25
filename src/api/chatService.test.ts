import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chatService';

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getOrCreateSession should return session', async () => {
    const mockSession = { id: 'session_1', status: 'active' };
    
    // First call to get sessions returns empty
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      // Second call to create session returns mockSession
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      });

    const result = await chatService.getOrCreateSession(
      'guest_1',
      'guest@example.com',
      'Guest'
    );
    
    expect(result).toEqual(mockSession.id);
  });

  it('sendMessage should successfully send message', async () => {
    const mockMessage = { id: 1, text: 'Hello' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMessage),
    });

    const result = await chatService.sendMessage('session_1', 'Hello', 'user');
    expect(global.fetch).toHaveBeenCalledWith('/api/chat/chat-messages/', expect.any(Object));
    expect(result).toEqual(mockMessage);
  });
});
