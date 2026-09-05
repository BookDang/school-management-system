import type { ExecutionContext } from '@nestjs/common';
import { getCurrentUserFromContext } from './current-user.decorator';

describe('getCurrentUserFromContext', () => {
  it('reads the user set on the request by the auth guard', () => {
    const user = { id: '1', email: 'jane@example.com' };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    expect(getCurrentUserFromContext(undefined, context)).toBe(user);
  });
});
