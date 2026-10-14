import type { DocHandle } from '@tessera/core';
import { listProperties, listViews } from '@tessera/core';
import { AppContextProvider } from '@tessera/core/react';
import { createTestAppContext, type TestAppContext } from '@tessera/core/testing';
import { TooltipProvider } from '@tessera/ui';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addRow, changeViewType, createDatabase } from '../../model/operations';
import { todayKey } from '../../query/dates';
import { overlays } from '../../overlay-store';
import { DatabaseView } from '../database-view';

let app: TestAppContext | null = null;
const handles: DocHandle[] = [];

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1200);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(720);
});

afterEach(async () => {
  vi.restoreAllMocks();
  for (const handle of handles.splice(0)) handle.release();
  await app?.dispose();
  app = null;
});

describe('CalendarView', () => {
  it('renders a calendar and opens an item when activated', async () => {
    app = await createTestAppContext();
    const { ctx } = app;
    const { page } = await createDatabase(ctx, { title: 'Tasks' });
    const handle = await ctx.loadDatabaseDoc(page.id);
    handles.push(handle);
    const ref = { id: page.id, doc: handle.doc };

    const view = listViews(handle.doc)[0];
    if (!view) throw new Error('Database has no view');
    changeViewType(ref, view.id, 'calendar');

    const dateProperty = listProperties(handle.doc).find((property) => property.type === 'date');
    if (!dateProperty) throw new Error('Calendar has no date property');
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const today = todayKey(Date.now(), timeZone);
    const row = await addRow(ctx, ref, {
      title: 'Write the brief',
      values: { [dateProperty.id]: { start: today } },
    });

    render(
      <AppContextProvider value={ctx}>
        <TooltipProvider>
          <DatabaseView databaseId={page.id} variant="page" readOnly={false} />
        </TooltipProvider>
      </AppContextProvider>,
    );

    const event = screen.getByRole('button', { name: /Write the brief/ });
    const calendar = event.closest('[role="group"]');
    expect(calendar).toContainElement(event);
    expect(event).toHaveAttribute('data-row-id', row.id);
    fireEvent.click(event);
    expect(overlays.getState().peek).toEqual({ rowId: row.id });
  });
});
