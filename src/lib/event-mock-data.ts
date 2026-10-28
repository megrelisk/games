import type { EventRecord } from "./types";

const t = (daysAgo: number) => new Date(Date.UTC(2026, 7, 22) - daysAgo * 86_400_000).toISOString();

export const MOCK_EVENT: EventRecord = {
  id: "e-soso-13-september",
  slug: "soso-13-september",
  title: "13 სექტემბერი — სოსოს თამაშები",
  event_date: "2026-09-13",
  notes_md: null,
  program: [],
  todos: [
    {
      id: "td-1",
      event_id: "e-soso-13-september",
      category: "კონტენტკრეატორის თასქები",
      label: "რატომ გადაწყვიტეთ მონაწილეობა?",
      done: false,
      position: 0,
      created_at: t(0),
    },
  ],
  created_at: t(0),
  updated_at: t(0),
};
