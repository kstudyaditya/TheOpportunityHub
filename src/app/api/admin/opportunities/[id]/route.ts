import {
  getDatabase,
  isOpportunityStatus,
  opportunitiesCollection,
} from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const status = typeof body === "object" && body !== null
    ? (body as Record<string, unknown>).status
    : undefined;
  if (!isOpportunityStatus(status)) {
    return Response.json({ error: "A valid opportunity status is required." }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const db = await getDatabase();
    const result = await opportunitiesCollection(db).updateOne(
      { _id: id },
      { $set: { status } },
    );

    if (!result.matchedCount) {
      return Response.json({ error: "Opportunity not found." }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to update opportunity in MongoDB:", error);
    return Response.json({ error: "Unable to update the opportunity." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const db = await getDatabase();
    const result = await opportunitiesCollection(db).deleteOne({ _id: id });
    if (!result.deletedCount) {
      return Response.json({ error: "Opportunity not found." }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete opportunity from MongoDB:", error);
    return Response.json({ error: "Unable to delete the opportunity." }, { status: 503 });
  }
}
