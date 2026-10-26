import {
  getDatabase,
  membersCollection,
  opportunitiesCollection,
  toMemberRecord,
  toOpportunityRecord,
} from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const [listings, members] = await Promise.all([
      opportunitiesCollection(db).find().sort({ createdAt: -1 }).toArray(),
      membersCollection(db).find().sort({ joinedAt: -1 }).toArray(),
    ]);

    return Response.json({
      listings: listings.map(toOpportunityRecord),
      members: members.map(toMemberRecord),
    });
  } catch (error) {
    console.error("Failed to load admin data from MongoDB:", error);
    return Response.json({ error: "Unable to load admin data from the database." }, { status: 503 });
  }
}
