import type { DocHandle } from '@tessera/core';
import { listViews } from '@tessera/core';
import { AppContextProvider } from '@tessera/core/react';
import { createTestAppContext, type TestAppContext } from '@tessera/core/testing';
import { TooltipProvider } from '@tessera/ui';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addRow, changeViewType, createDatabase } from '../../model/operations';
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

describe('TableView', () => {
  it('renders a table and opens an item when activated', async () => {
    app = await createTestAppContext();
    const { ctx } = app;
    const { page } = await createDatabase(ctx, { title: 'Tasks' });
    const handle = await ctx.loadDatabaseDoc(page.id);
    handles.push(handle);
    const ref = { id: page.id, doc: handle.doc };
    const row = await addRow(ctx, ref, { title: 'Write the brief' });

    const view = listViews(handle.doc)[0];
    if (!view) throw new Error('Database has no view');
    changeViewType(ref, view.id, 'table');

    render(
      <AppContextProvider value={ctx}>
        <TooltipProvider>
          <DatabaseView databaseId={page.id} variant="page" readOnly={false} />
        </TooltipProvider>
      </AppContextProvider>,
    );

    const grid = await screen.findByRole('grid');
    const gridRow = screen.getByRole('row', { name: 'Write the brief' });
    expect(grid).toContainElement(gridRow);
    expect(gridRow).toHaveAttribute('data-row-id', row.id);
    const user = userEvent.setup();
    await user.hover(gridRow);
    const openButton = within(gridRow).getByRole('button', { name: 'Open' });
    fireEvent.click(openButton);
    expect(overlays.getState().peek).toEqual({ rowId: row.id });
  });
});
