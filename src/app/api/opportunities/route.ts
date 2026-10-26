import { randomUUID } from "node:crypto";
import {
  getDatabase,
  opportunitiesCollection,
  toOpportunityRecord,
  isOpportunityType,
} from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const documents = await opportunitiesCollection(db)
      .find({ status: "Active" })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(documents.map(toOpportunityRecord));
  } catch (error) {
    console.error("Failed to load public opportunities from MongoDB:", error);
    return Response.json({ error: "Unable to load opportunities from the database." }, { status: 503 });
  }
}

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
  const location = typeof data.location === "string" ? data.location.trim() : "";

  if (
    !isOpportunityType(type) ||
    !title ||
    title.length > 90 ||
    !organization ||
    organization.length > 70 ||
    !location ||
    location.length > 70
  ) {
    return Response.json({ error: "Provide a valid type, title, organization, and location." }, { status: 400 });
  }

  try {
    const db = await getDatabase();
    const document = {
      _id: randomUUID(),
      type,
      title,
      organization,
      location,
      status: "Active" as const,
      createdAt: new Date(),
    };
    await opportunitiesCollection(db).insertOne(document);
    return Response.json(toOpportunityRecord(document), { status: 201 });
  } catch (error) {
    console.error("Failed to save public opportunity to MongoDB:", error);
    return Response.json({ error: "Unable to save the opportunity to the database." }, { status: 503 });
  }
}
