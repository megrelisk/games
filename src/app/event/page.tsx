import type { Metadata } from "next";

import { EventProvider } from "@/components/event-provider";
import { EventView } from "@/components/event/event-view";
import { getEvent } from "@/lib/data";
import { MOCK_EVENT } from "@/lib/event-mock-data";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getEvent(MOCK_EVENT.slug);
  return { title: event?.title ?? "ივენთი" };
}

export default async function EventPage() {
  const event = (await getEvent(MOCK_EVENT.slug)) ?? MOCK_EVENT;

  return (
    <EventProvider initialEvent={event}>
      <EventView />
    </EventProvider>
  );
}
