import { randomUUID } from "node:crypto";
import {
  getDatabase,
  isOpportunityType,
  opportunitiesCollection,
  toOpportunityRecord,
} from "@/lib/mongodb";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Opportunity details are required." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const type = data.type;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const organization = typeof data.organization === "string" ? data.organization.trim() : "";

  if (
    !isOpportunityType(type) ||
    !title ||
    title.length > 90 ||
    !organization ||
    organization.length > 70
  ) {
    return Response.json({ error: "Provide a valid type, title, and organization." }, { status: 400 });
  }

  try {
    const db = await getDatabase();
    const document = {
      _id: randomUUID(),
      type,
      title,
      organization,
      location: "Palatine, IL",
      status: "Pending" as const,
      createdAt: new Date(),
    };
    await opportunitiesCollection(db).insertOne(document);
    return Response.json(toOpportunityRecord(document), { status: 201 });
  } catch (error) {
    console.error("Failed to save admin opportunity to MongoDB:", error);
    return Response.json({ error: "Unable to save the opportunity to the database." }, { status: 503 });
  }
}
