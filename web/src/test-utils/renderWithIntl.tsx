import { type RenderOptions, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import admin from '../../messages/en/admin.json';
import common from '../../messages/en/common.json';
import user from '../../messages/en/user.json';

const messages = { Common: common, User: user, Admin: admin };

export const renderWithIntl = (ui: ReactElement, options?: RenderOptions) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
    options,
  );
