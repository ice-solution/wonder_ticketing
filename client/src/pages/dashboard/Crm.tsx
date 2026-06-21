import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "./DashboardLayout";

export function DashboardCrm() {
  const events = trpc.event.listMine.useQuery();
  const [eventId, setEventId] = useState("");
  const [tagName, setTagName] = useState("");
  const tags = trpc.crm.listTags.useQuery({ eventId }, { enabled: !!eventId });
  const createTag = trpc.crm.createTag.useMutation({
    onSuccess: () => tags.refetch(),
  });

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">CRM Tags (Pro)</h1>
      <select
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        className="mb-4 rounded border px-3 py-2 w-full max-w-md"
      >
        <option value="">Select event</option>
        {(events.data ?? []).map((ev) => (
          <option key={String(ev._id)} value={String(ev._id)}>
            {ev.title}
          </option>
        ))}
      </select>
      {eventId && (
        <div className="flex gap-2 mb-4 max-w-md">
          <input
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="New tag"
            className="flex-1 rounded border px-3 py-2"
          />
          <button
            type="button"
            onClick={() => {
              createTag.mutate({ eventId, name: tagName });
              setTagName("");
            }}
            className="rounded-lg bg-wonder-primary px-4 text-white"
          >
            Add
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {(tags.data ?? []).map((tag) => (
          <li key={String(tag._id)} className="rounded border bg-white px-4 py-2">
            {tag.name}
          </li>
        ))}
      </ul>
    </DashboardLayout>
  );
}
