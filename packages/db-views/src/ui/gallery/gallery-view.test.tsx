import type { DocHandle } from '@tessera/core';
import { listViews } from '@tessera/core';
import { AppContextProvider } from '@tessera/core/react';
import { createTestAppContext, type TestAppContext } from '@tessera/core/testing';
import { TooltipProvider } from '@tessera/ui';
import { fireEvent, render, screen } from '@testing-library/react';
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

describe('GalleryView', () => {
  it('renders a gallery and opens an item when activated', async () => {
    app = await createTestAppContext();
    const { ctx } = app;
    const { page } = await createDatabase(ctx, { title: 'Tasks' });
    const handle = await ctx.loadDatabaseDoc(page.id);
    handles.push(handle);
    const ref = { id: page.id, doc: handle.doc };
    const row = await addRow(ctx, ref, { title: 'Write the brief' });

    const view = listViews(handle.doc)[0];
    if (!view) throw new Error('Database has no view');
    changeViewType(ref, view.id, 'gallery');

    render(
      <AppContextProvider value={ctx}>
        <TooltipProvider>
          <DatabaseView databaseId={page.id} variant="page" readOnly={false} />
        </TooltipProvider>
      </AppContextProvider>,
    );

    const gallery = await screen.findByRole('list', { name: 'Gallery' });
    const card = screen.getByRole('button', { name: 'Write the brief' });
    expect(gallery).toContainElement(card);
    expect(card).toHaveAttribute('data-card-id', row.id);
    fireEvent.click(card);
    expect(overlays.getState().peek).toEqual({ rowId: row.id });
  });
});
