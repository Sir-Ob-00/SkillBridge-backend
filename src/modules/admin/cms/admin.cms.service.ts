import { randomUUID } from 'crypto';
import { ApiError } from '../../../utils/ApiError';
import { CreateContentInput, UpdateContentInput } from './admin.cms.validators';

export interface ContentRecord {
  id: string;
  key: string;
  title: string;
  body: string;
  published: boolean;
  updatedAt: string;
}

/**
 * CMS content is held in an in-memory store for now. A persistent `Content`
 * model + migration can be added later when durable storage is required.
 */
const store = new Map<string, ContentRecord>();

export const adminCmsService = {
  async list(): Promise<ContentRecord[]> {
    return Array.from(store.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async create(input: CreateContentInput): Promise<ContentRecord> {
    for (const existing of store.values()) {
      if (existing.key === input.key) {
        throw ApiError.conflict('Content with this key already exists.');
      }
    }

    const now = new Date().toISOString();
    const record: ContentRecord = {
      id: randomUUID(),
      key: input.key,
      title: input.title,
      body: input.body,
      published: input.published,
      updatedAt: now,
    };

    store.set(record.id, record);
    return record;
  },

  async update(id: string, input: UpdateContentInput): Promise<ContentRecord> {
    const existing = store.get(id);
    if (!existing) {
      throw ApiError.notFound('Content not found.');
    }

    const updated: ContentRecord = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    store.set(id, updated);
    return updated;
  },

  async remove(id: string): Promise<{ message: string }> {
    if (!store.has(id)) {
      throw ApiError.notFound('Content not found.');
    }

    store.delete(id);
    return { message: 'Content deleted.' };
  },
};
